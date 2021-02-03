import Emulator from './components/emulator/Emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StreamingEvent from './StreamingEvent';
import StreamingController from './StreamingController';

import buildInfo from './build-info.json';
import Logger from './Logger';
import StreamSocket from './service/StreamSocket';
import Measurement from './service/Measurement';
import LogQueueService from './service/LogQueueService';


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
    emulatorWidth: undefined,
    emulatorHeight: undefined,
    emulatorVersion: undefined
  };

  /**
   * Return an object of props and what type it should be.
   * We need to create a custom function for this since accessing `static propTypes` during runtime get a warning.
   */
  static get PROP_TYPES() {
    return {
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
      userClickedPlayAt: PropTypes.number, // Can't be changed after creation
      maxConnectionRetries: PropTypes.number // Can't be change after creation, Override the default threshold for now many time the SDK will try to reconnect to the stream
    };
  }

  static propTypes = StreamingView.PROP_TYPES;

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
    if (!internalSession) {
      this.LogQueueService = new LogQueueService(edgeNodeId, apiEndpoint, userId);
    }
    this.logger = new Logger(enableDebug);
    this.logger.log(`Latest update: ${buildInfo.tag}`);
    this.measurement = new Measurement(edgeNodeId);

    if (onEvent) {
      StreamingEvent.edgeNode(edgeNodeId).on('event', onEvent);
    }

    StreamingEvent.edgeNode(edgeNodeId)
      .once(StreamingEvent.STREAM_UNREACHABLE, () => this.setState({ isReadyStream: false }))
      .once(StreamingEvent.STREAM_TERMINATED, () => {
        if (this.measurement) {
          this.measurement.destroy();
        }
        if (this.streamSocket) {
          this.streamSocket.close();
        }
        this.setState({ isReadyStream: false });
      })
      .on(StreamingEvent.EMULATOR_CONFIGURATION, (configuration) => {
        this.setState({
          emulatorWidth: configuration.emulatorWidth,
          emulatorHeight: configuration.emulatorHeight,
          emulatorVersion: configuration.emulatorVersion
        });
      });

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
        console.error('StreamingView -> componentDidMount', JSON.stringify(err));

        if (!this.isMountedInView) {
          this.logger.log('Cancel action due to view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_UNREACHABLE, `Due to ${err.message}: ${err}`);
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
    if (this.LogQueueService) {
      this.LogQueueService.destroy();
    }
    StreamingEvent.destroyEdgeNode(this.props.edgeNodeId);
  }

  shouldComponentUpdate(nextProps) {
    // List of fields that should not generate into a render operation.
    const whiteListedFields = ['streamQualityRating', 'onEvent'];
    if (nextProps.streamQualityRating !== this.props.streamQualityRating) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_QUALITY_RATING, {
        streamQualityRating: nextProps.streamQualityRating
      });
    }

    if (nextProps.onEvent !== this.props.onEvent) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).off('event', this.props.onEvent);
      StreamingEvent.edgeNode(this.props.edgeNodeId).on('event', nextProps.onEvent);
    }

    // Do not render if there are only changes in the whitelisted props attributes.
    const hasChanges = Object.keys(StreamingView.PROP_TYPES).filter((key) => nextProps[key] !== this.props[key]);
    if(hasChanges.length > 0) {
      return hasChanges.filter((key) => whiteListedFields.indexOf(key) !== -1).length !== 0;
    } else {
      return true;
    }
  }

  /**
   * Register user event handler reporting different user events through Stream Socket into Supervisor
   */
  registerUserEventsHandler() {
    // Report user event - stream-loading-time
    StreamingEvent.edgeNode(this.props.edgeNodeId).once(StreamingEvent.STREAM_VIDEO_PLAYING, () => {
      const role = this.props.enableControl ? StreamingView.ROLE_PLAYER : StreamingView.ROLE_WATCHER;
      if (this.props.userClickedPlayAt > 0) {
        // Send the stream loading time if we have a user clicked play at props.
        const streamLoadingTime = Date.now() - this.props.userClickedPlayAt;
        const userEventPayload = {
          role: role,
          eventType: StreamingEvent.STREAM_LOADING_TIME,
          value: streamLoadingTime,
          message: `User event - ${StreamingEvent.STREAM_LOADING_TIME}: ${streamLoadingTime} ms.`
        };
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, userEventPayload);
      }

      // Send the video playing event when user can see the stream.
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
        role: role,
        eventType: StreamingEvent.USER_STARTS_PLAYING,
        value: 1,
        message: `User event - ${StreamingEvent.USER_STARTS_PLAYING}: Video is playing.`
      });
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
            emulatorWidth={this.state.emulatorWidth}
            emulatorHeight={this.state.emulatorHeight}
            emulatorVersion={this.state.emulatorVersion}
            logger={this.logger}
            edgeNodeId={edgeNodeId}
            maxConnectionRetries={this.props.maxConnectionRetries}
          />
        );
      case false:
        return <p style={{ color: 'white' }}>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }
}
