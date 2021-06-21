import Emulator from './components/emulator/Emulator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StreamingEvent from './StreamingEvent';
import StreamingController from './StreamingController';
import { v4 as uuid } from 'uuid';
import buildInfo from './build-info.json';
import Logger from './Logger';
import StreamSocket from './service/StreamSocket';
import Measurement from './service/Measurement';
import LogQueueService from './service/LogQueueService';
import BlackScreenDetector from './service/BlackScreenDetector';

const urlParse = require('url-parse');

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
    emulatorVersion: undefined,
    height: window.innerHeight + 'px',
    width: window.innerWidth + 'px'
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
      muted: PropTypes.bool, // Can be changed dynamically
      onEvent: PropTypes.func, // Can't be changed after creation
      streamQualityRating: PropTypes.number, // Can be changed dynamically
      enableDebug: PropTypes.bool, // Can't be changed after creation
      internalSession: PropTypes.bool, // Can't be changed after creation
      userClickedPlayAt: PropTypes.number, // Can't be changed after creation
      maxConnectionRetries: PropTypes.number, // Can't be change after creation, Override the default threshold for now many time the SDK will try to reconnect to the stream
      height: PropTypes.string,
      width: PropTypes.string,
      pingInterval: PropTypes.number
    };
  }

  static propTypes = StreamingView.PROP_TYPES;

  static defaultProps = {
    view: 'webrtc',
    enableFullScreen: true,
    enableControl: true,
    volume: 1.0,
    muted: false,
    pingInterval: 100
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
   */
  static get ROLE_WATCHER() {
    return 'watcher';
  }

  constructor(props) {
    super(props);
    this.isMountedInView = false;
    this.streamingViewId = uuid();
    this.emulatorIsReady = false;
  }

  componentDidMount() {
    this.isMountedInView = true;
    const {
      apiEndpoint,
      edgeNodeId,
      userId,
      edgeNodeEndpoint,
      internalSession,
      turnEndpoint,
      enableDebug,
      onEvent,
      pingInterval
    } = this.props;
    if (!internalSession) {
      this.LogQueueService = new LogQueueService(edgeNodeId, apiEndpoint, userId, this.streamingViewId);
    }

    this.blackScreenDetector = new BlackScreenDetector(edgeNodeId, this.streamingViewId);

    this.logger = new Logger(enableDebug);
    this.measurement = new Measurement(edgeNodeId);

    if (onEvent) {
      StreamingEvent.edgeNode(edgeNodeId).on('event', onEvent);
    }

    this.logger.log(`SDK Version: ${buildInfo.tag}`);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('error', this.onError);

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
      })
      .when([StreamingEvent.STREAM_WEBRTC_READY, StreamingEvent.STREAM_EMULATOR_READY], ([onUserInteractionCallback]) => {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_READY, onUserInteractionCallback);
      })

    StreamingController({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId,
      internalSession: internalSession
    })
      .then((controller) => controller.waitFor(StreamingController.WAIT_FOR_ENDPOINT))
      .then((state) => state.endpoint)
      .then((streamEndpoint) => {
        // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value instead of the
        // public endpoint received from Service Coordinator.
        return internalSession && edgeNodeEndpoint ? edgeNodeEndpoint : streamEndpoint;
      })
      .then((streamEndpoint) => {
        this.measurement.initWebRtc(`${urlParse(streamEndpoint).origin}/measurement/webrtc`, pingInterval);
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
    if (this.blackScreenDetector) {
      this.blackScreenDetector.destroy();
    }

    if (this.LogQueueService) {
      this.LogQueueService.destroy();
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('error', this.onError);
    StreamingEvent.destroyEdgeNode(this.props.edgeNodeId);
  }
  /**
   * Update the state parameter heigth and width when screen size is changeing.
   */
  onResize = () => {
    if (this.onResizeTieout) {
      clearTimeout(this.onResizeTieout);
    }
    this.onResizeTieout = setTimeout(() => {
      if (this.isMountedInView) {
        this.setState({
          height: window.innerHeight + 'px',
          width: window.innerWidth + 'px'
        });
      }
    }, 50);
  };

  /**
   * Trigger event when error occurs
   */
  onError = (error) => {
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.ERROR_BROWSER, {
      message: error.message,
      filename: error.filename,
      stack: error.stack
    });
    return false;
  };

  shouldComponentUpdate(nextProps, nextState) {
    // List of fields that should not generate into a render operation.
    const whiteListedFields = ['streamQualityRating', 'onEvent'];
    if (nextProps.streamQualityRating !== this.props.streamQualityRating) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_QUALITY_RATING, {
        streamQualityRating: nextProps.streamQualityRating
      });
    }

    if (nextProps.onEvent !== this.props.onEvent) {
      if (this.props.onEvent) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).off('event', this.props.onEvent);
      }
      if (nextProps.onEvent) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).on('event', nextProps.onEvent);
      }
    }

    // Do not render if there are only changes in the whitelisted props attributes.
    const hasChanges = Object.keys(StreamingView.PROP_TYPES).filter((key) => nextProps[key] !== this.props[key]);
    if (hasChanges.length > 0) {
      return hasChanges.filter((key) => whiteListedFields.indexOf(key) === -1).length !== 0;
    } else {
      return this.state !== nextState;
    }
  }

  /**
   * Register user event handler reporting different user events through Stream Socket into Supervisor
   */
  registerUserEventsHandler() {
    // Report user event - stream-loading-time
    StreamingEvent.edgeNode(this.props.edgeNodeId).once(StreamingEvent.STREAM_READY, () => {
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

      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_AUDIO_CODEC, (codec) => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
          role: role,
          eventType: StreamingEvent.STREAM_AUDIO_CODEC,
          value: codec,
          message: `User event - ${StreamingEvent.STREAM_AUDIO_CODEC}: ${codec}`
        });
      });

      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_VIDEO_CODEC, (codec) => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
          role: role,
          eventType: StreamingEvent.STREAM_VIDEO_CODEC,
          value: codec,
          message: `User event - ${StreamingEvent.STREAM_VIDEO_CODEC}: ${codec}.`
        });
      });
    });
  }

  render() {
    const { enableControl, enableFullScreen, view, volume, muted, edgeNodeId, height: propsHeight, width: propsWidth } = this.props;
    const { height: stateHeight, width: stateWidth } = this.state;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <div style={{ height: propsHeight || stateHeight, width: propsWidth || stateWidth }} id={this.streamingViewId}>
            <Emulator
              uri={this.state.streamEndpoint}
              turnEndpoint={this.state.turnEndpoint}
              enableControl={enableControl}
              enableFullScreen={enableFullScreen}
              view={view}
              volume={volume}
              muted={muted}
              poll={true}
              emulatorWidth={this.state.emulatorWidth}
              emulatorHeight={this.state.emulatorHeight}
              emulatorVersion={this.state.emulatorVersion}
              logger={this.logger}
              edgeNodeId={edgeNodeId}
              maxConnectionRetries={this.props.maxConnectionRetries}
            />
          </div>
        );
      case false:
        return (
          <p id={this.streamingViewId} style={{ color: 'white' }}>
            EdgeNode Stream is unreachable
          </p>
        );
      default:
        return <p style={{ color: 'white' }}>Loading EdgeNode Stream</p>;
    }
  }
}
