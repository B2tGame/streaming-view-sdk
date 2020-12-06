import Emulator from './components/emulator/Emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StreamingEvent from './StreamingEvent';
import StreamingController from './StreamingController';

import buildInfo from './build-info.json';
import Logger from './Logger';
import StreamSocket from './service/StreamSocket';
import Measurement from './service/Measurement';

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
    turnEndpoint: undefined
  };

  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired, // Can't be changed after creation
    edgeNodeId: PropTypes.string.isRequired, // Can't be changed after creation
    edgeNodeEndpoint: PropTypes.string, // Can't be changed after creation
    turnEndpoint: PropTypes.string, // Can't be changed after creation
    userId: PropTypes.string, // Can't be changed after creation
    enableControl: PropTypes.bool, // Can be changed dynamically
    enableFullScreen: PropTypes.bool, // Can be changed dynamically
    view: PropTypes.oneOf(['webrtc', 'png']), // Can't be changed after creation
    volume: PropTypes.number, // Can be changed dynamically, Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
    onEvent: PropTypes.func, // Can't be changed after creation
    streamQualityRating: PropTypes.number, // Can be changed dynamically
    enableDebug: PropTypes.bool, // Can't be changed after creation
    internalSession: PropTypes.bool, // Can't be changed after creation
    userClickedPlayAt: PropTypes.number // Can't be changed after creation
  };

  /**
   * Player is a user with enabled control
   * @return {string}
   */
  static get ROLE_PLAYER() {
    return 'player';
  }

  /**
   * Watcher is a user with disabled control
   * @return {string}
   * @constructor
   */
  static get ROLE_WATCHER() {
    return 'watcher';
  }

  constructor(props) {
    super(props);
    this.isMountedInView = false;
  }

  componentDidMount() {
    this.isMountedInView = true;
    const { apiEndpoint, edgeNodeId, userId, edgeNodeEndpoint, internalSession, turnEndpoint, enableDebug, onEvent } = this.props;
    this.logger = new Logger(enableDebug);
    this.logger.log(`Latest update: ${buildInfo.tag}`);
    this.measurement = new Measurement(edgeNodeId);

    if (onEvent) {
      StreamingEvent.edgeNode(edgeNodeId).on('event', onEvent);
    }

    StreamingEvent.edgeNode(edgeNodeId).once(StreamingEvent.STREAM_UNREACHABLE, () => this.setState({ isReadyStream: false }));

    StreamingController({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId
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

        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.EDGE_NODE_READY_TO_ACCEPT_CONNECTION);
        this.streamSocket = new StreamSocket(edgeNodeId, streamEndpoint, userId, internalSession);
        this.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
          turnEndpoint: internalSession && turnEndpoint ? turnEndpoint : undefined
        });
        this.registerUserEventsHandler();

      })
      .catch((err) => {
        if (!this.isMountedInView) {
          this.logger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        this.logger.error('StreamingController Errors -', err);
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_UNREACHABLE, err);
      });
  }

  componentWillUnmount() {
    this.isMountedInView = false;
    if (this.measurement) {
      this.measurement.destroy();
    }
    if (this.streamSocket) {
      this.streamSocket.close();
    }
    StreamingEvent.destroyEdgeNode(this.props.edgeNodeId);
  }


  shouldComponentUpdate(nextProps) {
    if (nextProps.streamQualityRating) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_QUALITY_RATING, { streamQualityRating: nextProps.streamQualityRating });
    }
    // Don't re-render component when rating was changed
    return this.props.streamQualityRating === nextProps.streamQualityRating;
  }

  /**
   * Register user event handler reporting different user events through Stream Socket into Supervisor
   */
  registerUserEventsHandler() {
    // Report user event - stream-loading-time
    StreamingEvent.edgeNode(this.props.edgeNodeId).once(StreamingEvent.STREAM_VIDEO_PLAYING, () => {
      const streamLoadingTime = Date.now() - this.props.userClickedPlayAt;
      const userEventPayload = {
        role: this.props.enableControl ? StreamingView.ROLE_PLAYER : StreamingView.ROLE_WATCHER,
        eventType: StreamingEvent.STREAM_LOADING_TIME,
        value: streamLoadingTime,
        message: `User event - ${StreamingEvent.STREAM_LOADING_TIME}: ${streamLoadingTime} ms.`
      };

      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_LOADING_TIME, userEventPayload);
    });
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
