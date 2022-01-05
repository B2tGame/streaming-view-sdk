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

exports["default"] = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _setInterval2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-interval"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

var _StreamCaptureService = _interopRequireDefault(require("../../../service/StreamCaptureService"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var rttMeasurementTimeout = 500;
var touchAnimTime = 200;
/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams.
 */

var EmulatorWebrtcView = /*#__PURE__*/function (_Component) {
  (0, _inherits2["default"])(EmulatorWebrtcView, _Component);

  var _super = _createSuper(EmulatorWebrtcView);

  function EmulatorWebrtcView(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, EmulatorWebrtcView);
    _this = _super.call(this, props);
    _this.state = {
      audio: false,
      video: false,
      playing: false
    };

    _this.playVideo = function () {
      var video = _this.video.current;

      if (video && video.paused) {
        return (video.play() || _promise["default"].reject(new Error('video.play() was not a promise'))).then(function () {
          _this.requireUserInteractionToPlay = false;
        })["catch"](function (error) {
          _this.props.logger.error("Fail to start playing stream by user interaction due to ".concat(error.name), error.message);
        });
      }

      _this.requireUserInteractionToPlay = false;

      _this.props.logger.info('Video stream was already playing');
    };

    _this.onUserInteraction = function () {
      if (_this.requireUserInteractionToPlay) {
        _this.playVideo();
      }

      _this.updateVideoMutedProp();

      _this.updateVideoVolumeProp();

      if (_this.isMountedInView && _this.video.current && _this.video.current.paused) {
        _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_MISSING);
      }
    };

    _this.lastTouchEnd = 0;

    _this.onTouchEnd = function () {
      _this.lastTouchEnd = new Date().getTime();
    };

    _this.onTouchStart = function (event) {
      if (_this.lastTouchEnd + touchAnimTime > new Date().getTime()) {
        return;
      }

      if (_this.touchTimer !== undefined) {
        cancelAnimationFrame(_this.touchTimer);
      }

      var startTime = performance.now();

      var runTouchDetection = function runTouchDetection(timestamp) {
        var foundCircle = _this.streamCaptureService.detectTouch(event.x, event.y, _this.props.emulatorWidth, _this.props.emulatorHeight);

        if (foundCircle) {
          var rtt = timestamp - startTime;

          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_RTT, {
            rtt: rtt
          });
        } else if (timestamp > startTime + rttMeasurementTimeout) {
          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_RTT_TIMOUT, {
            timeout: true,
            time: rttMeasurementTimeout
          });
        } else {
          requestAnimationFrame(runTouchDetection);
        }
      };

      _this.touchTimer = requestAnimationFrame(runTouchDetection);
    };

    _this.onDisconnect = function () {
      if (_this.isMountedInView) {
        _this.setState({
          video: false,
          audio: false
        }, function () {
          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_UNAVAILABLE);

          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_AUDIO_UNAVAILABLE);
        });
      }
    };

    _this.onConnect = function (track) {
      var video = _this.video.current;

      if (!video) {
        // Component was unmounted.
        return;
      }

      if (!video.srcObject) {
        video.srcObject = new MediaStream();
      }

      video.srcObject.addTrack(track);

      if (track.kind === 'video') {
        _this.setState({
          video: true
        }, function () {
          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_AVAILABLE);
        });
      }

      if (track.kind === 'audio') {
        _this.setState({
          audio: true
        }, function () {
          return _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_AUDIO_AVAILABLE);
        });
      }
    };

    _this.timeout = function (timeoutDuration) {
      return new _promise["default"](function (resolve) {
        (0, _setTimeout2["default"])(function () {
          return resolve();
        }, timeoutDuration);
      });
    };

    _this.onCanPlay = function () {
      var video = _this.video.current;

      if (!video) {
        _this.props.logger.error('Video DOM element not ready');

        return; // Component was unmounted.
      } // This code snippet allow us to detect and calculate the amount of time the stream is buffed/delayed on client side between received to displayed for consumer.
      // const requestVideoFrameCallback = (now, metadata) => {
      //   console.log(metadata.presentationTime - metadata.receiveTime);
      //   video.requestVideoFrameCallback(requestVideoFrameCallback);
      // };
      // video.requestVideoFrameCallback(requestVideoFrameCallback);


      var onUserInteractionCallback = function onUserInteractionCallback() {
        _this.playVideo();

        _this.updateVideoMutedProp();

        _this.updateVideoVolumeProp();
      };

      _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_CAN_PLAY);

      if (!_this.requireUserInteractionToPlay) {
        if (video.paused) {
          return (video.play() || _promise["default"].resolve('video.play() was not a promise'))["catch"](function (error) {
            if (error.name === 'NotAllowedError') {
              // The user agent (browser) or operating system doesn't allow playback of media in the current context or situation.
              // This may happen, if the browser requires the user to explicitly start media playback by clicking a "play" button.
              _this.requireUserInteractionToPlay = true;

              _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].REQUIRE_USER_PLAY_INTERACTION, onUserInteractionCallback);
            } else {
              _this.props.logger.error("Fail to start playing stream due to ".concat(error.name), error.message);
            }
          })["finally"](function () {
            _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_WEBRTC_READY, onUserInteractionCallback);
          });
        } else {
          _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_WEBRTC_READY, onUserInteractionCallback);
        }

        _this.props.logger.info('Video stream was already playing');
      } else {
        _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_WEBRTC_READY, onUserInteractionCallback);
      }
    };

    _this.onPlaying = function () {
      _this.requireUserInteractionToPlay = false;

      _this.setState({
        playing: true
      });

      _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_PLAYING);

      _this.props.jsep.peerConnection.getStats().then(function (stats) {
        (0, _forEach["default"])(stats).call(stats, function (report) {
          if (report.type === 'inbound-rtp') {
            var codec = (stats.get(report.codecId) || {}).mimeType;

            if (report.kind === 'audio' && codec) {
              _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_AUDIO_CODEC, codec.replace('audio/', ''));
            } else if (report.kind === 'video' && codec) {
              _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_CODEC, codec.replace('video/', ''));
            }
          }
        });
      });
    };

    _this.onContextMenu = function (e) {
      e.preventDefault();
    };

    _this.video = /*#__PURE__*/_react["default"].createRef();
    _this.canvas = /*#__PURE__*/_react["default"].createRef();
    _this.canvasTouch = /*#__PURE__*/_react["default"].createRef();
    _this.isMountedInView = false;
    _this.captureScreenMetaData = [];
    _this.requireUserInteractionToPlay = false;
    _this.streamCaptureService = new _StreamCaptureService["default"](_this.props.edgeNodeId, _this.video, _this.canvas, _this.canvasTouch);
    return _this;
  }

  (0, _createClass2["default"])(EmulatorWebrtcView, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      this.isMountedInView = true;

      _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).on(_StreamingEvent["default"].STREAM_CONNECTED, this.onConnect).on(_StreamingEvent["default"].STREAM_DISCONNECTED, this.onDisconnect).on(_StreamingEvent["default"].USER_INTERACTION, this.onUserInteraction);

      if (this.props.measureTouchRtt) {
        _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).on(_StreamingEvent["default"].TOUCH_START, this.onTouchStart);

        _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).on(_StreamingEvent["default"].TOUCH_END, this.onTouchEnd);
      }

      this.setState({
        video: false,
        audio: false
      }, function () {
        return _this2.props.jsep.startStream();
      }); // Performing 'health-check' of the stream and reporting events when video is missing

      this.timer = (0, _setInterval2["default"])(function () {
        if (_this2.requireUserInteractionToPlay) {
          return; // Do not reporting any StreamingEvent.STREAM_VIDEO_MISSING if the stream is waiting for user interaction in order to start the stream.
        }

        if (_this2.isMountedInView && _this2.video.current && _this2.video.current.paused) {
          _StreamingEvent["default"].edgeNode(_this2.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_VIDEO_MISSING);
        } else {
          _this2.streamCaptureService.captureScreenshot(_this2.props.emulatorWidth, _this2.props.emulatorHeight);
        }
      }, 500);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.isMountedInView = false;

      if (this.timer) {
        clearInterval(this.timer);
      }

      _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).off(_StreamingEvent["default"].STREAM_CONNECTED, this.onConnect).off(_StreamingEvent["default"].STREAM_DISCONNECTED, this.onDisconnect).off(_StreamingEvent["default"].USER_INTERACTION, this.onUserInteraction);

      if (this.props.measureTouchRtt) {
        _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).off(_StreamingEvent["default"].TOUCH_START, this.onTouchStart);

        _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).off(_StreamingEvent["default"].TOUCH_END, this.onTouchEnd);
      }

      this.props.jsep.disconnect();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (prevProps.volume !== this.props.volume) {
        this.updateVideoVolumeProp();
      }

      if (prevProps.muted !== this.props.muted) {
        this.updateVideoMutedProp();
      }
    }
    /**
     * Update video muted property based on React property, when there is an update
     */

  }, {
    key: "updateVideoMutedProp",
    value: function updateVideoMutedProp() {
      if (this.isMountedInView && this.video.current && this.video.current.muted !== this.props.muted) {
        var streamIsPaused = this.video.current.paused;
        this.video.current.muted = this.props.muted; // If video was paused after unmuting, fire unmute error event, mute audio and play video
        // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes

        if (streamIsPaused === false && streamIsPaused !== this.video.current.paused) {
          _StreamingEvent["default"].edgeNode(this.props.edgeNodeId).emit(_StreamingEvent["default"].STREAM_AUDIO_UNMUTE_ERROR); // Play muted video, since browser may pause the video when un-muting action has failed


          this.video.current.muted = true;
          this.playVideo();
        }
      }
    }
    /**
     * Update video volume property based on React property, when there is an update
     * Note: iOS - Safari doesn't support volume attribute, so video can be only muted or un-muted (after user interaction)
     */

  }, {
    key: "updateVideoVolumeProp",
    value: function updateVideoVolumeProp() {
      if (this.isMountedInView && this.video.current && this.video.current.volume !== this.props.volume) {
        this.video.current.volume = this.props.volume;
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          emulatorWidth = _this$props.emulatorWidth,
          emulatorHeight = _this$props.emulatorHeight;
      var style = {
        margin: '0 auto',
        visibility: this.state.playing ? 'visible' : 'hidden',
        width: '100%',
        height: '100%'
      };
      return /*#__PURE__*/_react["default"].createElement("div", {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }
      }, /*#__PURE__*/_react["default"].createElement("video", {
        ref: this.video,
        style: style,
        className: "video-webrtc" // Initial muted value, un-muting is done dynamically through ref on userInteraction
        // Known issue: https://github.com/facebook/react/issues/10389
        ,
        muted: true,
        onContextMenu: this.onContextMenu,
        onCanPlay: this.onCanPlay,
        onPlaying: this.onPlaying,
        playsInline: true
      }), /*#__PURE__*/_react["default"].createElement("canvas", {
        style: {
          display: 'none'
        },
        ref: this.canvas,
        height: emulatorHeight / _StreamCaptureService["default"].CANVAS_SCALE_FACTOR,
        width: emulatorWidth / _StreamCaptureService["default"].CANVAS_SCALE_FACTOR
      }), /*#__PURE__*/_react["default"].createElement("canvas", {
        style: {
          display: 'none'
        },
        ref: this.canvasTouch,
        height: "23",
        width: "23"
      }));
    }
  }]);
  return EmulatorWebrtcView;
}(_react.Component);

exports["default"] = EmulatorWebrtcView;
EmulatorWebrtcView.propTypes = {
  /** gRPC Endpoint where we can reach the emulator. */
  uri: _propTypes["default"].string.isRequired,

  /** Streaming Edge node ID */
  edgeNodeId: _propTypes["default"].string.isRequired,

  /** Event Logger */
  logger: _propTypes["default"].object.isRequired,

  /** Jsep protocol driver, used to establish the video stream. */
  jsep: _propTypes["default"].object,

  /** Volume of the video element, value between 0 and 1.  */
  volume: _propTypes["default"].number,

  /** Audio is muted or enabled (un-muted) */
  muted: _propTypes["default"].bool,

  /** The width of the screen/video feed provided by the emulator */
  emulatorWidth: _propTypes["default"].number,

  /** The height of the screen/video feed provided by the emulator */
  emulatorHeight: _propTypes["default"].number,
  emulatorVersion: _propTypes["default"].string,

  /** Defines if touch rtt should be measured */
  measureTouchRtt: _propTypes["default"].bool
};