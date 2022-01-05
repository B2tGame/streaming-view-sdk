"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Emulator = _interopRequireDefault(require("./components/emulator/Emulator"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _StreamingEvent = _interopRequireDefault(require("./StreamingEvent"));

var _StreamingController = _interopRequireDefault(require("./StreamingController"));

var _uuid = require("uuid");

var _buildInfo = _interopRequireDefault(require("./build-info.json"));

var _Logger = _interopRequireDefault(require("./Logger"));

var _StreamSocket = _interopRequireDefault(require("./service/StreamSocket"));

var _Measurement = _interopRequireDefault(require("./service/Measurement"));

var _LogQueueService = _interopRequireDefault(require("./service/LogQueueService"));

var _BlackScreenDetector = _interopRequireDefault(require("./service/BlackScreenDetector"));

var _StreamWebRtc = _interopRequireDefault(require("./service/StreamWebRtc"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const urlParse = require('url-parse');
/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */


class StreamingView extends _react.Component {
  /**
   * Return an object of props and what type it should be.
   * We need to create a custom function for this since accessing `static propTypes` during runtime get a warning.
   */
  static get PROP_TYPES() {
    return {
      apiEndpoint: _propTypes.default.string.isRequired,
      // Can't be changed after creation
      edgeNodeId: _propTypes.default.string.isRequired,
      // Can't be changed after creation
      edgeNodeEndpoint: _propTypes.default.string,
      // Can't be changed after creation
      turnEndpoint: _propTypes.default.string,
      // Can't be changed after creation
      userId: _propTypes.default.string,
      // Can't be changed after creation
      enableControl: _propTypes.default.bool,
      // Can be changed dynamically
      enableFullScreen: _propTypes.default.bool,
      // Can be changed dynamically
      view: _propTypes.default.oneOf(['webrtc', 'png']),
      // Can't be changed after creation
      volume: _propTypes.default.number,
      // Can be changed dynamically, Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
      muted: _propTypes.default.bool,
      // Can be changed dynamically
      onEvent: _propTypes.default.func,
      // Can't be changed after creation
      streamQualityRating: _propTypes.default.number,
      // Can be changed dynamically
      internalSession: _propTypes.default.bool,
      // Can't be changed after creation
      userClickedPlayAt: _propTypes.default.number,
      // Can't be changed after creation
      maxConnectionRetries: _propTypes.default.number,
      // Can't be change after creation, Override the default threshold for now many time the SDK will try to reconnect to the stream
      height: _propTypes.default.string,
      width: _propTypes.default.string,
      pingInterval: _propTypes.default.number,
      measureTouchRtt: _propTypes.default.bool,
      playoutDelayHint: _propTypes.default.number
    };
  }

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
    this.state = {
      isReadyStream: undefined,
      streamEndpoint: undefined,
      turnEndpoint: undefined,
      emulatorWidth: undefined,
      emulatorHeight: undefined,
      emulatorVersion: undefined,
      height: window.innerHeight + 'px',
      width: window.innerWidth + 'px'
    };

    this.onResize = () => {
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

    this.onError = error => {
      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.ERROR_BROWSER, {
        message: error.message,
        filename: error.filename,
        stack: error.stack
      });

      return false;
    };

    this.isMountedInView = false;
    this.streamingViewId = (0, _uuid.v4)();
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
      onEvent,
      pingInterval
    } = this.props;

    if (!internalSession) {
      this.LogQueueService = new _LogQueueService.default(edgeNodeId, apiEndpoint, userId, this.streamingViewId);
    }

    this.blackScreenDetector = new _BlackScreenDetector.default(edgeNodeId, this.streamingViewId);
    this.logger = new _Logger.default();
    this.measurement = new _Measurement.default(edgeNodeId, this.streamingViewId, this.logger);

    if (onEvent) {
      _StreamingEvent.default.edgeNode(edgeNodeId).on('event', onEvent);
    }

    this.logger.info('StreamingView was mounted', Object.keys(this.props).reduce((propObj, propName) => {
      const propValue = this.props[propName]; // All this extra logic to filter functions from rest of props

      if (typeof propValue !== 'function') {
        propObj[propName] = propValue;
      }

      return propObj;
    }, {}));
    this.logger.log("SDK Version: ".concat(_buildInfo.default.tag));
    window.addEventListener('resize', this.onResize);
    window.addEventListener('error', this.onError);

    _StreamingEvent.default.edgeNode(edgeNodeId).once(_StreamingEvent.default.STREAM_UNREACHABLE, () => this.setState({
      isReadyStream: false
    })).once(_StreamingEvent.default.STREAM_TERMINATED, () => {
      if (this.measurement) {
        this.measurement.destroy();
      }

      if (this.streamSocket) {
        this.streamSocket.close();
      }

      this.setState({
        isReadyStream: false
      });
    }).on(_StreamingEvent.default.EMULATOR_CONFIGURATION, configuration => {
      this.setState({
        emulatorWidth: configuration.emulatorWidth,
        emulatorHeight: configuration.emulatorHeight,
        emulatorVersion: configuration.emulatorVersion
      });
    }).on([_StreamingEvent.default.STREAM_WEBRTC_READY, _StreamingEvent.default.STREAM_EMULATOR_READY], _ref => {
      let [onUserInteractionCallback] = _ref;

      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_READY, onUserInteractionCallback);
    });

    (0, _StreamingController.default)({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId,
      internalSession: internalSession
    }).then(controller => controller.waitFor(_StreamingController.default.WAIT_FOR_ENDPOINT)).then(state => state.endpoint).then(streamEndpoint => {
      // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value instead of the
      // public endpoint received from Service Coordinator.
      return internalSession && edgeNodeEndpoint ? edgeNodeEndpoint : streamEndpoint;
    }).then(streamEndpoint => {
      this.measurement.initWebRtc("".concat(urlParse(streamEndpoint).origin, "/measurement/webrtc"), pingInterval);

      if (!this.isMountedInView) {
        this.logger.log('Cancel action due to view is not mounted.');
        return; // Cancel any action if we not longer are mounted.
      }

      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.EDGE_NODE_READY_TO_ACCEPT_CONNECTION);

      this.streamSocket = new _StreamSocket.default(edgeNodeId, streamEndpoint, userId, internalSession);
      this.setState({
        isReadyStream: true,
        streamEndpoint: streamEndpoint,
        turnEndpoint: internalSession && turnEndpoint ? turnEndpoint : undefined
      });
      this.registerUserEventsHandler();
    }).catch(err => {
      if (!this.isMountedInView) {
        this.logger.log('Cancel action due to view is not mounted.');
        return; // Cancel any action if we not longer are mounted.
      }

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_UNREACHABLE, "Due to ".concat(err.message, ": ").concat(err));
    });
  }

  componentWillUnmount() {
    this.logger.info('StreamingView component will unmount', {
      measurement: this.measurement ? 'should-be-destroy' : 'skip',
      websocket: this.streamSocket ? 'should-be-destroy' : 'skip',
      blackScreenDetector: this.blackScreenDetector ? 'should-be-destroy' : 'skip',
      logQueueService: this.LogQueueService ? 'should-be-destroy' : 'skip'
    });
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
    setTimeout(() => {
      _StreamingEvent.default.destroyEdgeNode(this.props.edgeNodeId);
    }, 500);
  }
  /**
   * Update the state parameter heigth and width when screen size is changeing.
   */


  shouldComponentUpdate(nextProps, nextState) {
    // List of fields that should not generate into a render operation.
    const whiteListedFields = ['streamQualityRating', 'onEvent'];

    if (nextProps.streamQualityRating !== this.props.streamQualityRating) {
      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_QUALITY_RATING, {
        streamQualityRating: nextProps.streamQualityRating
      });
    }

    if (nextProps.onEvent !== this.props.onEvent) {
      if (this.props.onEvent) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off('event', this.props.onEvent);
      }

      if (nextProps.onEvent) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on('event', nextProps.onEvent);
      }
    } // Do not render if there are only changes in the whitelisted props attributes.


    const hasChanges = Object.keys(StreamingView.PROP_TYPES).filter(key => nextProps[key] !== this.props[key]);

    if (hasChanges.length > 0) {
      return hasChanges.filter(key => whiteListedFields.indexOf(key) === -1).length !== 0;
    } else {
      return this.state !== nextState;
    }
  }
  /**
   * Register user event handler reporting different user events through Stream Socket into Supervisor
   */


  registerUserEventsHandler() {
    // Report user event - stream-loading-time
    _StreamingEvent.default.edgeNode(this.props.edgeNodeId).once(_StreamingEvent.default.STREAM_READY, () => {
      const role = this.props.enableControl ? StreamingView.ROLE_PLAYER : StreamingView.ROLE_WATCHER;

      if (this.props.userClickedPlayAt > 0) {
        // Send the stream loading time if we have a user clicked play at props.
        const streamLoadingTime = Date.now() - this.props.userClickedPlayAt;
        const userEventPayload = {
          role: role,
          eventType: _StreamingEvent.default.STREAM_LOADING_TIME,
          value: streamLoadingTime,
          message: "User event - ".concat(_StreamingEvent.default.STREAM_LOADING_TIME, ": ").concat(streamLoadingTime, " ms.")
        };

        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, userEventPayload);
      } // Send the video playing event when user can see the stream.


      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
        role: role,
        eventType: _StreamingEvent.default.USER_STARTS_PLAYING,
        value: 1,
        message: "User event - ".concat(_StreamingEvent.default.USER_STARTS_PLAYING, ": Video is playing.")
      });

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.STREAM_AUDIO_CODEC, codec => {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
          role: role,
          eventType: _StreamingEvent.default.STREAM_AUDIO_CODEC,
          value: codec,
          message: "User event - ".concat(_StreamingEvent.default.STREAM_AUDIO_CODEC, ": ").concat(codec)
        });
      });

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.STREAM_VIDEO_CODEC, codec => {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
          role: role,
          eventType: _StreamingEvent.default.STREAM_VIDEO_CODEC,
          value: codec,
          message: "User event - ".concat(_StreamingEvent.default.STREAM_VIDEO_CODEC, ": ").concat(codec, ".")
        });
      });
    });
  }

  render() {
    const {
      enableControl,
      enableFullScreen,
      view,
      volume,
      muted,
      edgeNodeId,
      height: propsHeight,
      width: propsWidth,
      playoutDelayHint
    } = this.props;
    const {
      height: stateHeight,
      width: stateWidth
    } = this.state;

    switch (this.state.isReadyStream) {
      case true:
        return /*#__PURE__*/_react.default.createElement("div", {
          style: {
            height: propsHeight || stateHeight,
            width: propsWidth || stateWidth
          },
          id: this.streamingViewId
        }, /*#__PURE__*/_react.default.createElement(_Emulator.default, {
          uri: this.state.streamEndpoint,
          turnEndpoint: this.state.turnEndpoint,
          enableControl: enableControl,
          enableFullScreen: enableFullScreen,
          view: view,
          volume: volume,
          muted: muted,
          poll: true,
          emulatorWidth: this.state.emulatorWidth,
          emulatorHeight: this.state.emulatorHeight,
          emulatorVersion: this.state.emulatorVersion,
          logger: this.logger,
          edgeNodeId: edgeNodeId,
          maxConnectionRetries: this.props.maxConnectionRetries,
          measureTouchRtt: this.props.measureTouchRtt,
          playoutDelayHint: playoutDelayHint
        }));

      case false:
        return /*#__PURE__*/_react.default.createElement("p", {
          id: this.streamingViewId,
          style: {
            color: 'white'
          }
        }, "EdgeNode Stream is unreachable");

      default:
        return /*#__PURE__*/_react.default.createElement("p", {
          style: {
            color: 'white'
          },
          className: 'streaming-view-loading-edge-node'
        }, "Loading EdgeNode Stream");
    }
  }

}

exports.default = StreamingView;
StreamingView.propTypes = StreamingView.PROP_TYPES;
StreamingView.defaultProps = {
  view: 'webrtc',
  enableFullScreen: true,
  enableControl: true,
  volume: 1.0,
  muted: false,
  pingInterval: _StreamWebRtc.default.WEBRTC_PING_INTERVAL,
  measureTouchRtt: true,
  playoutDelayHint: 0
};