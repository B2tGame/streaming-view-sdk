"use strict";

var _typeof = require("@babel/runtime-corejs3/helpers/typeof");

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _EmulatorPngView = _interopRequireDefault(require("./views/EmulatorPngView.js"));

var _EmulatorWebrtcView = _interopRequireDefault(require("./views/EmulatorWebrtcView.js"));

var _EventHandler = _interopRequireDefault(require("./views/EventHandler"));

var _JsepProtocol = _interopRequireDefault(require("./net/JsepProtocol.js"));

var Proto = _interopRequireWildcard(require("../../proto/emulator_controller_pb"));

var _emulator_web_client = require("../../proto/emulator_web_client");

var _StreamingEvent = _interopRequireDefault(require("../../StreamingEvent"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

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
var Emulator = /*#__PURE__*/function (_Component) {
  (0, _inherits2.default)(Emulator, _Component);

  var _super = _createSuper(Emulator);

  function Emulator(props) {
    var _this;

    (0, _classCallCheck2.default)(this, Emulator);
    _this = _super.call(this, props);
    _this.components = {
      webrtc: _EmulatorWebrtcView.default,
      png: _EmulatorPngView.default
    };
    _this.state = {
      streamingConnectionId: Date.now(),
      width: undefined,
      height: undefined
    };

    _this.onDisconnect = function () {
      setTimeout(function () {
        _this.reload(_StreamingEvent.default.STREAM_DISCONNECTED);
      }, 250);
    };

    _this.onVideoUnavailable = function () {
      setTimeout(function () {
        _this.reload(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE);
      }, 250);
    };

    _this.onVideoMissing = function () {
      _this.reload(_StreamingEvent.default.STREAM_VIDEO_MISSING);
    };

    _this.onConnect = function () {
      _this.reloadCount = 0;
      _this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT;
    };

    _this.sendKey = function (key) {
      var request = new Proto.KeyboardEvent();
      request.setEventtype(Proto.KeyboardEvent.KeyEventType.KEYPRESS);
      request.setKey(key);

      _this.jsep.send('keyboard', request);
    };

    _this.isMountedInView = false;
    _this.view = /*#__PURE__*/_react.default.createRef();
    _this.reloadCount = 0;
    _this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;
    var _this$props = _this.props,
        uri = _this$props.uri,
        auth = _this$props.auth,
        poll = _this$props.poll;
    _this.emulator = new _emulator_web_client.EmulatorControllerService(uri, auth, _this.onError);
    _this.rtc = new _emulator_web_client.RtcService(uri, auth, _this.onError);
    _this.jsep = new _JsepProtocol.default(_this.emulator, _this.rtc, poll, _this.props.edgeNodeId, _this.props.logger, _this.props.turnEndpoint, _this.props.playoutDelayHint, _this.props.iceServers);

    _StreamingEvent.default.edgeNode(_this.props.edgeNodeId).on(_StreamingEvent.default.STREAM_DISCONNECTED, _this.onDisconnect).on(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE, _this.onVideoUnavailable).on(_StreamingEvent.default.STREAM_VIDEO_MISSING, _this.onVideoMissing).on(_StreamingEvent.default.STREAM_CONNECTED, _this.onConnect);

    return _this;
  }

  (0, _createClass2.default)(Emulator, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.isMountedInView = true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.isMountedInView = false;

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off(_StreamingEvent.default.STREAM_DISCONNECTED, this.onDisconnect).off(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE, this.onVideoUnavailable).off(_StreamingEvent.default.STREAM_VIDEO_MISSING, this.onVideoMissing).off(_StreamingEvent.default.STREAM_CONNECTED, this.onConnect);
    }
  }, {
    key: "reload",
    value:
    /**
     *
     * @param {string} cause
     */
    function reload(cause) {
      this.props.logger.info('stream not working, request reload');

      if ((this.reloadHoldOff || 0) < Date.now() && this.isMountedInView) {
        this.reloadHoldOff = Date.now() + Emulator.RELOAD_HOLD_OFF_TIMEOUT;

        if (this.reloadCount >= this.props.maxConnectionRetries) {
          var _context;

          this.props.logger.info((0, _concat.default)(_context = "reload count: ".concat(this.reloadCount, " of ")).call(_context, this.props.maxConnectionRetries)); // Give up and exit the stream.

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
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          view = _this$props2.view,
          poll = _this$props2.poll,
          volume = _this$props2.volume,
          muted = _this$props2.muted,
          enableFullScreen = _this$props2.enableFullScreen,
          enableControl = _this$props2.enableControl,
          uri = _this$props2.uri,
          emulatorWidth = _this$props2.emulatorWidth,
          emulatorHeight = _this$props2.emulatorHeight,
          emulatorVersion = _this$props2.emulatorVersion,
          logger = _this$props2.logger,
          edgeNodeId = _this$props2.edgeNodeId,
          measureTouchRtt = _this$props2.measureTouchRtt;
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
  }], [{
    key: "RELOAD_HOLD_OFF_TIMEOUT",
    get:
    /**
     * The minimum amount time the SDK should wait before doing a hard reload due to bad/none functional stream.
     * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
     * @return {number}
     */
    function get() {
      return 10000;
    }
    /**
     * The minimum amount time the SDK should wait (after a onConnect event) before doing a hard reload due to bad/none functional stream.
     * Consider the time needed after it has been reloaded, it will need some time to do a reconnection etc.
     * @return {number}
     */

  }, {
    key: "RELOAD_HOLD_OFF_TIMEOUT_AFTER_CONNECT",
    get: function get() {
      return 5000;
    }
    /**
     * Number of times the system should reload the stream before entering an unreachable state.
     * @return {number}
     */

  }, {
    key: "RELOAD_FAILURE_THRESHOLD",
    get: function get() {
      return 2;
    }
  }]);
  return Emulator;
}(_react.Component);

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
  playoutDelayHint: _propTypes.default.number,

  /** Ice Server Candidates */
  iceServers: _propTypes.default.array
};
Emulator.defaultProps = {
  auth: null,
  poll: false,
  maxConnectionRetries: Emulator.RELOAD_FAILURE_THRESHOLD,
  measureTouchRtt: true
};
var _default = Emulator;
exports.default = _default;