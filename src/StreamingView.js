import Emulator from './components/emulator/Emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StreamingEvent from './StreamingEvent';
import StreamingController from './StreamingController';

import buildInfo from './build-info.json';
import Logger from './Logger';
import StreamSocket from './service/StreamSocket';

/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
export default class StreamingView extends Component {
  state = {
    isReadyStream: undefined,
    streamEndpoint: undefined,
    turnEndpoint: undefined,
  };

  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired, // Can't be change after creation
    edgeNodeId: PropTypes.string.isRequired, // Can't be change after creation
    edgeNodeEndpoint: PropTypes.string, // Can't be change after creation
    turnEndpoint: PropTypes.string, // Can't be change after creation
    userId: PropTypes.string, // Can't be change after creation
    enableControl: PropTypes.bool, // Can be change dynamic
    enableFullScreen: PropTypes.bool, // Can be change dynamic
    view: PropTypes.oneOf(['webrtc', 'png']), // Can't be change after creation
    volume: PropTypes.number, // Can be change dynamic, Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
    onEvent: PropTypes.func, // Can't be change after creation
    streamQualityRating: PropTypes.number, // Can be change dynamic
    enableDebug: PropTypes.bool, // Can't be change after creation
    internalSession: PropTypes.bool, // Can't be change after creation
  };

  constructor() {
    super();
    this.isMountedInView = false;
  }


  componentWillUnmount() {
    this.isMountedInView = false;
    StreamingEvent.destroyEdgeNode(this.props.edgeNodeId)
    if (this.streamSocket) {
      this.streamSocket.close();
    }
  }

  componentDidMount() {
    const { apiEndpoint, edgeNodeId, userId, edgeNodeEndpoint, internalSession, turnEndpoint } = this.props;
    const onEvent = this.props.onEvent || (() => {
    });
    this.logger = new Logger(this.props.enableDebug);
    this.logger.log(`Latest update: ${buildInfo.tag}`);

    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.SERVER_OUT_OF_CAPACITY, (event) => onEvent(StreamingEvent.SERVER_OUT_OF_CAPACITY, event));
    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STREAM_CONNECTED, (event) => onEvent(StreamingEvent.STREAM_CONNECTED, event));
    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.EMULATOR_CONFIGURATION, (event) => onEvent(StreamingEvent.EMULATOR_CONFIGURATION, event));

    this.isMountedInView = true;
    StreamingController({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId,
    })
      .then((controller) => controller.getStreamEndpoint())
      .then((streamEndpoint) => {
        // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value insted of the
        // public endpoint received from Service Coordinator.
        return internalSession && edgeNodeEndpoint ? edgeNodeEndpoint : streamEndpoint;
      })
      .then((streamEndpoint) => {
        if (!this.isMountedInView) {
          this.logger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        this.streamSocket = new StreamSocket(edgeNodeId, streamEndpoint, userId, internalSession);
        this.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
          turnEndpoint: internalSession && turnEndpoint ? turnEndpoint : undefined,
        });

      })
      .catch((err) => {
        if (!this.isMountedInView) {
          this.logger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        this.logger.error('StreamingController Errors -', err);
        // TODO: emit event to rob0 when stream is unreachable
        this.setState({
          isReadyStream: false,
        });
      });
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.streamQualityRating) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_QUALITY_RATING, { streamQualityRating: nextProps.streamQualityRating });
    }
    // Don't re-render component when rating was changed
    return this.props.streamQualityRating === nextProps.streamQualityRating;
  }

  render() {
    const { enableControl, enableFullScreen, view, volume, edgeNodeId } = this.props;
    switch (this.state.isReadyStream) {
      case true:
        return (
          <Emulator
            uri={this.state.streamEndpoint}
            turnEndpoint={this.state.turnEndpoint}
            enableControl={enableControl}
            enableFullScreen={enableFullScreen}
            view={view}
            volume={volume}
            poll={true}
            logger={this.logger}
            edgeNodeId={edgeNodeId}
          />
        );
      case false:
        return <p style={{ color: 'white' }}>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }
}
