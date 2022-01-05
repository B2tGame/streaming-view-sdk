"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _EmulatorPngView = _interopRequireDefault(require("./views/EmulatorPngView.js"));

var _EmulatorWebrtcView = _interopRequireDefault(require("./views/EmulatorWebrtcView.js"));

var _EventHandler = _interopRequireDefault(require("./views/EventHandler"));

var _JsepProtocol = _interopRequireDefault(require("./net/JsepProtocol.js"));

var Proto = _interopRequireWildcard(require("../../proto/emulator_controller_pb"));

var _emulator_web_client = require("../../proto/emulator_web_client");

var _StreamingEvent = _interopRequireDefault(require("../../StreamingEvent"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * A React component that displays a remote android emulator.
 *
 * The emulator will mount a png or webrtc view component to display the current state
 * of the emulator. It will translate mouse events on this component and send them
 * to the actual emulator.
 *
 * #### Authentication Service
 *
 * The authentication service should implement the following methods:
 *
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 *
 * #### Type of view
 *
 * You usually want this to be webrtc as this will make use of the efficient
 * webrtc implementation. The png view will request screenshots, which are
 * very slow, and require the envoy proxy. You should not use this for remote emulators.
 *
 * Note that chrome will not autoplay the video if it is not muted and no interaction
 * with the page has taken place. See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes.
 *
 * #### Pressing hardware buttons
 *
 * This component has a method `sendKey` to sends a key to the emulator.
 * You can use this to send physical hardwar events to the emulator for example:
 *
 * "AudioVolumeDown" -  Decreases the audio volume.
 * "AudioVolumeUp"   -  Increases the audio volume.
 * "Power"           -  The Power button or key, turn off the device.
 * "AppSwitch"       -  Should bring up the application switcher dialog.
 * "GoHome"          -  Go to the home screen.
 * "GoBack"          -  Open the previous screen you were looking at.
 */
class Emulator extends _react.Component {
  /**
   * The minimum amount time the SDK should wait before doing a hard reload due to bad/none functional stream.
   * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
   * @return {number}
   */
  static get RELOAD_HOLD_OFF_TIMEOUT() {
    return 10000;
  }
  /**
   * The minimum amount time the SDK should wait (after a onConnect event) before doing a hard reload due to bad/none functional stream.
   * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
   * @return {number}
   */


  static get RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT() {
    return 5000;
  }
  /**
   * Number of times the system should reload the stream before entering an unreachable state.
   * @return {number}
   */


  static get RELOAD_FAILURE_THRESHOLD() {
    return 2;
  }

  constructor(props) {
    super(props);
    this.components = {
      webrtc: _EmulatorWebrtcView.default,
      png: _EmulatorPngView.default
    };
    this.state = {
      streamingConnectionId: Date.now(),
      width: undefined,
      height: undefined
    };

    this.onDisconnect = () => {
      setTimeout(() => {
        this.reload(_StreamingEvent.default.STREAM_DISCONNECTED);
      }, 250);
    };

    this.onVideoUnavailable = () => {
      setTimeout(() => {
        this.reload(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE);
      }, 250);
    };

    this.onVideoMissing = () => {
      this.reload(_StreamingEvent.default.STREAM_VIDEO_MISSING);
    };

    this.onConnect = () => {
      this.reloadCount = 0;
      this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT;
    };

    this.sendKey = key => {
      const request = new Proto.KeyboardEvent();
      request.setEventtype(Proto.KeyboardEvent.KeyEventType.KEYPRESS);
      request.setKey(key);
      this.jsep.send('keyboard', request);
    };

    this.isMountedInView = false;
    this.view = /*#__PURE__*/_react.default.createRef();
    this.reloadCount = 0;
    this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;
    const {
      uri,
      auth,
      poll
    } = this.props;
    this.emulator = new _emulator_web_client.EmulatorControllerService(uri, auth, this.onError);
    this.rtc = new _emulator_web_client.RtcService(uri, auth, this.onError);
    this.jsep = new _JsepProtocol.default(this.emulator, this.rtc, poll, this.props.edgeNodeId, this.props.logger, this.props.turnEndpoint, this.props.playoutDelayHint);

    _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.STREAM_DISCONNECTED, this.onDisconnect).on(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE, this.onVideoUnavailable).on(_StreamingEvent.default.STREAM_VIDEO_MISSING, this.onVideoMissing).on(_StreamingEvent.default.STREAM_CONNECTED, this.onConnect);
  }

  componentDidMount() {
    this.isMountedInView = true;
  }

  componentWillUnmount() {
    this.isMountedInView = false;

    _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off(_StreamingEvent.default.STREAM_DISCONNECTED, this.onDisconnect).off(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE, this.onVideoUnavailable).off(_StreamingEvent.default.STREAM_VIDEO_MISSING, this.onVideoMissing).off(_StreamingEvent.default.STREAM_CONNECTED, this.onConnect);
  }

  /**
   *
   * @param {string} cause
   */
  reload(cause) {
    this.props.logger.info('stream not working, request reload');

    if ((this.reloadHoldOff || 0) < Date.now() && this.isMountedInView) {
      this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;

      if (this.reloadCount >= this.props.maxConnectionRetries) {
        // Give up and exit the stream.
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_UNREACHABLE, "Reached max number of reload tries: ".concat(this.reloadCount));
      } else {
        this.reloadCount++;

        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_RELOADED, cause);

        this.setState({
          streamingConnectionId: Date.now()
        });
      }
    }
  }

  render() {
    const {
      view,
      poll,
      volume,
      muted,
      enableFullScreen,
      enableControl,
      uri,
      emulatorWidth,
      emulatorHeight,
      emulatorVersion,
      logger,
      edgeNodeId,
      measureTouchRtt
    } = this.props;
    return /*#__PURE__*/_react.default.createElement(_EventHandler.default, {
      key: this.state.streamingConnectionId,
      ref: this.view,
      emulatorWidth: emulatorWidth,
      emulatorHeight: emulatorHeight,
      emulatorVersion: emulatorVersion,
      uri: uri,
      emulator: this.emulator,
      jsep: this.jsep,
      poll: poll,
      volume: volume,
      muted: muted,
      onAudioStateChange: this.onAudioStateChange,
      enableFullScreen: enableFullScreen,
      enableControl: enableControl,
      logger: logger,
      edgeNodeId: edgeNodeId,
      measureTouchRtt: measureTouchRtt,
      view: this.components[view] || _EmulatorWebrtcView.default
    });
  }

}

Emulator.propTypes = {
  /** gRPC Endpoint where we can reach the emulator. */
  uri: _propTypes.default.string.isRequired,

  /** Override the default uri for turn servers */
  turnEndpoint: _propTypes.default.string,

  /** Streaming Edge node ID */
  edgeNodeId: _propTypes.default.string.isRequired,

  /** The authentication service to use, or null for no authentication. */
  auth: _propTypes.default.object,

  /** Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100% */
  volume: _propTypes.default.number,

  /** Audio is muted or enabled (un-muted) */
  muted: _propTypes.default.bool,

  /** The underlying view used to display the emulator, one of ["webrtc", "png"] */
  view: _propTypes.default.oneOf(['webrtc', 'png']),

  /** True if polling should be used, only set this to true if you are using the go webgrpc proxy. */
  poll: _propTypes.default.bool,

  /** True if the fullscreen should be enabled. */
  enableFullScreen: _propTypes.default.bool,

  /** Enable or disable user interactions with the game */
  enableControl: _propTypes.default.bool,

  /** Event Logger */
  logger: _propTypes.default.object.isRequired,

  /** Override the default threshold for now many time the SDK will try to reconnect to the stream */
  maxConnectionRetries: _propTypes.default.number,

  /** Emulator Width */
  emulatorWidth: _propTypes.default.number,

  /** Emulator Height */
  emulatorHeight: _propTypes.default.number,

  /** Emulator Version */
  emulatorVersion: _propTypes.default.string,

  /** Defines if touch rtt should be measured */
  measureTouchRtt: _propTypes.default.bool,

  /** Playout Delay Hint */
  playoutDelayHint: _propTypes.default.number
};
Emulator.defaultProps = {
  auth: null,
  poll: false,
  maxConnectionRetries: Emulator.RELOAD_FAILURE_THRESHOLD,
  measureTouchRtt: true
};
var _default = Emulator;
exports.default = _default;