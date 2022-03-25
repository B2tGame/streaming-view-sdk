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

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

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

var _urlParse = _interopRequireDefault(require("url-parse"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
var StreamingView = /*#__PURE__*/function (_Component) {
  (0, _inherits2.default)(StreamingView, _Component);

  var _super = _createSuper(StreamingView);

  function StreamingView(props) {
    var _this;

    (0, _classCallCheck2.default)(this, StreamingView);
    _this = _super.call(this, props);
    _this.state = {
      isReadyStream: undefined,
      streamEndpoint: undefined,
      turnEndpoint: undefined,
      emulatorWidth: undefined,
      emulatorHeight: undefined,
      emulatorVersion: undefined,
      shouldRandomlyMeasureRtt: undefined,
      height: window.innerHeight + 'px',
      width: window.innerWidth + 'px'
    };

    _this.onResize = function () {
      if (_this.onResizeTieout) {
        clearTimeout(_this.onResizeTieout);
      }

      _this.onResizeTieout = setTimeout(function () {
        if (_this.isMountedInView) {
          _this.setState({
            height: window.innerHeight + 'px',
            width: window.innerWidth + 'px'
          });
        }
      }, 50);
    };

    _this.onError = function (error) {
      _StreamingEvent.default.edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent.default.ERROR_BROWSER, {
        message: error.message,
        filename: error.filename,
        stack: error.stack
      });

      return false;
    };

    _this.isMountedInView = false;
    _this.streamingViewId = (0, _uuid.v4)();
    _this.emulatorIsReady = false; // Simple coinflip if we should measure rtt... if prop is not passed!

    if (props.measureTouchRtt === undefined) {
      _this.shouldRandomlyMeasureRtt = Math.random() < 0.5;
    }

    return _this;
  }

  (0, _createClass2.default)(StreamingView, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _context,
          _this2 = this;

      this.isMountedInView = true;
      var _this$props = this.props,
          apiEndpoint = _this$props.apiEndpoint,
          edgeNodeId = _this$props.edgeNodeId,
          userId = _this$props.userId,
          edgeNodeEndpoint = _this$props.edgeNodeEndpoint,
          internalSession = _this$props.internalSession,
          turnEndpoint = _this$props.turnEndpoint,
          onEvent = _this$props.onEvent,
          pingInterval = _this$props.pingInterval,
          measureWebrtcRtt = _this$props.measureWebrtcRtt;

      if (!internalSession) {
        this.LogQueueService = new _LogQueueService.default(edgeNodeId, apiEndpoint, userId, this.streamingViewId);
      }

      this.blackScreenDetector = new _BlackScreenDetector.default(edgeNodeId, this.streamingViewId);
      this.logger = new _Logger.default();

      if (measureWebrtcRtt) {
        this.measurement = new _Measurement.default(edgeNodeId, this.streamingViewId, this.logger);
      }

      if (onEvent) {
        _StreamingEvent.default.edgeNode(edgeNodeId).on('event', onEvent);
      }

      if (this.props.measureTouchRtt === undefined) {
        // Run coinflip to in 50% of cases measure rtt
        this.setState({
          shouldRandomlyMeasureRtt: Math.random() < 0.5
        });
      }

      this.logger.info('StreamingView was mounted', (0, _reduce.default)(_context = (0, _keys.default)(this.props)).call(_context, function (propObj, propName) {
        var propValue = _this2.props[propName]; // All this extra logic to filter functions from rest of props

        if (typeof propValue !== 'function') {
          propObj[propName] = propValue;
        }

        return propObj;
      }, {}));
      this.logger.log("SDK Version: ".concat(_buildInfo.default.tag));
      window.addEventListener('resize', this.onResize);
      window.addEventListener('error', this.onError);

      _StreamingEvent.default.edgeNode(edgeNodeId).once(_StreamingEvent.default.STREAM_UNREACHABLE, function () {
        return _this2.setState({
          isReadyStream: false
        });
      }).once(_StreamingEvent.default.STREAM_TERMINATED, function () {
        if (_this2.measurement) {
          _this2.measurement.destroy();
        }

        if (_this2.streamSocket) {
          _this2.streamSocket.close();
        }

        _this2.setState({
          isReadyStream: false
        });
      }).on(_StreamingEvent.default.EMULATOR_CONFIGURATION, function (configuration) {
        _this2.setState({
          emulatorWidth: configuration.emulatorWidth,
          emulatorHeight: configuration.emulatorHeight,
          emulatorVersion: configuration.emulatorVersion
        });
      }).on([_StreamingEvent.default.STREAM_WEBRTC_READY, _StreamingEvent.default.STREAM_EMULATOR_READY], function (_ref) {
        var _ref2 = (0, _slicedToArray2.default)(_ref, 1),
            onUserInteractionCallback = _ref2[0];

        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_READY, onUserInteractionCallback);
      });

      (0, _StreamingController.default)({
        apiEndpoint: apiEndpoint,
        edgeNodeId: edgeNodeId,
        internalSession: internalSession
      }).then(function (controller) {
        return controller.waitFor(_StreamingController.default.WAIT_FOR_ENDPOINT);
      }).then(function (state) {
        return state.endpoint;
      }).then(function (streamEndpoint) {
        // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value instead of the
        // public endpoint received from Service Coordinator.
        return internalSession && edgeNodeEndpoint ? edgeNodeEndpoint : streamEndpoint;
      }).then(function (streamEndpoint) {
        if (_this2.measurement) {
          _this2.measurement.initWebRtc("".concat((0, _urlParse.default)(streamEndpoint).origin, "/measurement/webrtc"), pingInterval);
        }

        if (!_this2.isMountedInView) {
          _this2.logger.log('Cancel action due to view is not mounted.');

          return; // Cancel any action if we not longer are mounted.
        }

        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.EDGE_NODE_READY_TO_ACCEPT_CONNECTION);

        _this2.streamSocket = new _StreamSocket.default(edgeNodeId, streamEndpoint, userId, internalSession);

        _this2.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
          turnEndpoint: internalSession && turnEndpoint ? turnEndpoint : undefined
        });

        _this2.registerUserEventsHandler();
      }).catch(function (err) {
        var _context2;

        if (!_this2.isMountedInView) {
          _this2.logger.log('Cancel action due to view is not mounted.');

          return; // Cancel any action if we not longer are mounted.
        }

        _StreamingEvent.default.edgeNode(_this2.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_UNREACHABLE, (0, _concat.default)(_context2 = "Due to ".concat(err.message, ": ")).call(_context2, err));
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      // If for some reason the measure touchrtt is
      if (this.props.measureTouchRtt === undefined && this.state.shouldRandomlyMeasureRtt === undefined) {
        // Run coinflip to in 50% of cases measure rtt
        this.setState({
          shouldRandomlyMeasureRtt: Math.random() < 0.5
        });
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var _this3 = this;

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
      setTimeout(function () {
        _StreamingEvent.default.destroyEdgeNode(_this3.props.edgeNodeId);
      }, 500);
    }
    /**
     * Update the state parameter heigth and width when screen size is changeing.
     */

  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      var _context3,
          _this4 = this;

      // List of fields that should not generate into a render operation.
      var whiteListedFields = ['streamQualityRating', 'onEvent'];

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


      var hasChanges = (0, _filter.default)(_context3 = (0, _keys.default)(StreamingView.PROP_TYPES)).call(_context3, function (key) {
        return nextProps[key] !== _this4.props[key];
      });

      if (hasChanges.length > 0) {
        return (0, _filter.default)(hasChanges).call(hasChanges, function (key) {
          return (0, _indexOf.default)(whiteListedFields).call(whiteListedFields, key) === -1;
        }).length !== 0;
      } else {
        return this.state !== nextState;
      }
    }
    /**
     * Register user event handler reporting different user events through Stream Socket into Supervisor
     */

  }, {
    key: "registerUserEventsHandler",
    value: function registerUserEventsHandler() {
      var _this5 = this;

      // Report user event - stream-loading-time
      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).once(_StreamingEvent.default.STREAM_READY, function () {
        var role = _this5.props.enableControl ? StreamingView.ROLE_PLAYER : StreamingView.ROLE_WATCHER;

        if (_this5.props.userClickedPlayAt > 0) {
          var _context4;

          // Send the stream loading time if we have a user clicked play at props.
          var streamLoadingTime = Date.now() - _this5.props.userClickedPlayAt;

          var userEventPayload = {
            role: role,
            eventType: _StreamingEvent.default.STREAM_LOADING_TIME,
            value: streamLoadingTime,
            message: (0, _concat.default)(_context4 = "User event - ".concat(_StreamingEvent.default.STREAM_LOADING_TIME, ": ")).call(_context4, streamLoadingTime, " ms.")
          };

          _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, userEventPayload);
        } // Send the video playing event when user can see the stream.


        _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
          role: role,
          eventType: _StreamingEvent.default.USER_STARTS_PLAYING,
          value: 1,
          message: "User event - ".concat(_StreamingEvent.default.USER_STARTS_PLAYING, ": Video is playing.")
        });

        _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).on(_StreamingEvent.default.STREAM_AUDIO_CODEC, function (codec) {
          var _context5;

          _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
            role: role,
            eventType: _StreamingEvent.default.STREAM_AUDIO_CODEC,
            value: codec,
            message: (0, _concat.default)(_context5 = "User event - ".concat(_StreamingEvent.default.STREAM_AUDIO_CODEC, ": ")).call(_context5, codec)
          });
        });

        _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).on(_StreamingEvent.default.STREAM_VIDEO_CODEC, function (codec) {
          var _context6;

          _StreamingEvent.default.edgeNode(_this5.props.edgeNodeId).emit(_StreamingEvent.default.USER_EVENT_REPORT, {
            role: role,
            eventType: _StreamingEvent.default.STREAM_VIDEO_CODEC,
            value: codec,
            message: (0, _concat.default)(_context6 = "User event - ".concat(_StreamingEvent.default.STREAM_VIDEO_CODEC, ": ")).call(_context6, codec, ".")
          });
        });
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props$measureTo;

      var _this$props2 = this.props,
          enableControl = _this$props2.enableControl,
          enableFullScreen = _this$props2.enableFullScreen,
          view = _this$props2.view,
          volume = _this$props2.volume,
          muted = _this$props2.muted,
          edgeNodeId = _this$props2.edgeNodeId,
          propsHeight = _this$props2.height,
          propsWidth = _this$props2.width,
          playoutDelayHint = _this$props2.playoutDelayHint,
          iceServers = _this$props2.iceServers,
          vp8MaxQuantization = _this$props2.vp8MaxQuantization;
      var _this$state = this.state,
          stateHeight = _this$state.height,
          stateWidth = _this$state.width;

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
            measureTouchRtt: (_this$props$measureTo = this.props.measureTouchRtt) !== null && _this$props$measureTo !== void 0 ? _this$props$measureTo : this.state.shouldRandomlyMeasureRtt,
            playoutDelayHint: playoutDelayHint,
            iceServers: iceServers,
            vp8MaxQuantization: vp8MaxQuantization
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
  }], [{
    key: "PROP_TYPES",
    get:
    /**
     * Return an object of props and what type it should be.
     * We need to create a custom function for this since accessing `static propTypes` during runtime get a warning.
     */
    function get() {
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
        playoutDelayHint: _propTypes.default.number,
        iceServers: _propTypes.default.array,
        measureWebrtcRtt: _propTypes.default.bool,
        vp8MaxQuantization: _propTypes.default.number
      };
    }
  }, {
    key: "ROLE_PLAYER",
    get:
    /**
     * Player is a user with enabled control
     * @return {string}
     */
    function get() {
      return 'player';
    }
    /**
     * Watcher is a user with disabled control
     * @return {string}
     */

  }, {
    key: "ROLE_WATCHER",
    get: function get() {
      return 'watcher';
    }
  }]);
  return StreamingView;
}(_react.Component);

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
  playoutDelayHint: 0,
  iceServers: [],
  measureWebrtcRtt: true
};