"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _Logger = _interopRequireDefault(require("./Logger"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Extend Event Emitter with an emit that always send the event to 'event' target
 */
var ExtendedEventEmitter = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2.default)(ExtendedEventEmitter, _EventEmitter);

  var _super = _createSuper(ExtendedEventEmitter);

  /**
   * @param {string} edgeNodeId
   */
  function ExtendedEventEmitter() {
    var _this;

    var edgeNodeId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    (0, _classCallCheck2.default)(this, ExtendedEventEmitter);
    _this = _super.call(this);
    _this.edgeNodeId = edgeNodeId;
    return _this;
  }
  /**
   * Check if a debug method called applandStreamingRawEventCallback exist, if so invoke it with the raw event data.
   * Example implementation in puppeteer test framework.
   * ```
   * await browser.page().exposeFunction('applandStreamingRawEventCallback', (edgeNodeId, event, data) => {
   *   console.log(edgeNodeId, event, data);
   * });
   * ```
   * @param {string} type
   * @param {*} event
   */


  (0, _createClass2.default)(ExtendedEventEmitter, [{
    key: "invokeTestFrameworkRawEventCallback",
    value: function invokeTestFrameworkRawEventCallback(type, event) {
      if ((window || {}).applandStreamingRawEventCallback) {
        (window || {}).applandStreamingRawEventCallback(this.edgeNodeId, type, event);
      }
    }
    /**
     * Event an event
     * @param {string} event
     * @param {*} data
     * @return {ExtendedEventEmitter}
     */

  }, {
    key: "emit",
    value: function emit(event, data) {
      if (_Logger.default.isVerboseEnabled() && event !== StreamingEvent.LOG) {
        // Emit all events except for StreamingEvent.LOG since that has been logged out already.
        console.info('Streaming SDK:', event, data);
      }

      this.invokeTestFrameworkRawEventCallback(event, data);
      return this._emit(event, data);
    }
    /**
     * Private version of the emit, should not be called outside this file
     * @param {string} event
     * @param {*} data
     * @return {ExtendedEventEmitter}
     * @private
     */

  }, {
    key: "_emit",
    value: function _emit(event, data) {
      (0, _get2.default)((0, _getPrototypeOf2.default)(ExtendedEventEmitter.prototype), "emit", this).call(this, 'event', event, data);
      (0, _get2.default)((0, _getPrototypeOf2.default)(ExtendedEventEmitter.prototype), "emit", this).call(this, event, data);
      return this;
    }
    /**
     * When one or more events were received at least once.
     * @param {string[]} events List of one or more events to wait in before calling the callback.
     * @param {function} callback Callback, argument list data payload for each event in the same order as the events list
     */

  }, {
    key: "on",
    value: function on(events, callback) {
      if (!Array.isArray(events)) {
        return (0, _get2.default)((0, _getPrototypeOf2.default)(ExtendedEventEmitter.prototype), "on", this).call(this, events, callback);
      } else {
        var eventData = {};
        (0, _get2.default)((0, _getPrototypeOf2.default)(ExtendedEventEmitter.prototype), "on", this).call(this, 'event', function (event, data) {
          if ((0, _includes.default)(events).call(events, event)) {
            eventData[event] = data || undefined;

            if ((0, _keys.default)(eventData).length === events.length) {
              callback((0, _map.default)(events).call(events, function (e) {
                return eventData[e];
              }));
            }
          }
        });
      }
    }
  }]);
  return ExtendedEventEmitter;
}(_eventemitter.default);

var globalEventEmitter = new ExtendedEventEmitter();
var edgeNodeEventEmitter = {};
/**
 * Streaming Event Emitter bus for sending and receiving event across the SDK.
 */

var StreamingEvent = /*#__PURE__*/function () {
  function StreamingEvent() {
    (0, _classCallCheck2.default)(this, StreamingEvent);
  }

  (0, _createClass2.default)(StreamingEvent, null, [{
    key: "LOG",
    get:
    /**
     * Event of log with payload {type: string, data: []*}
     * @return {string}
     */
    function get() {
      return 'log';
    }
    /**
     * Error event with an exception as payload
     * @return {string}
     */

  }, {
    key: "ERROR",
    get: function get() {
      return 'error';
    }
    /**
     * Event fired when browser error occurs
     * @return {string}
     */

  }, {
    key: "ERROR_BROWSER",
    get: function get() {
      return 'error-browser';
    }
    /**
     * Event fired when a touch or click has started
     * @return {string}
     */

  }, {
    key: "TOUCH_START",
    get: function get() {
      return 'touch-start';
    }
    /**
     * Event fired when a new RTT value based on a touch has been detected
     * @return {string}
     */

  }, {
    key: "TOUCH_RTT",
    get: function get() {
      return 'touch-rtt';
    }
    /**
     * Event fired when a touch rtt times out
     * @return {string}
     */

  }, {
    key: "TOUCH_RTT_TIMOUT",
    get: function get() {
      return 'touch-rtt-timeout';
    }
    /**
     * Event that is fire when the SDK receiving the edge node are ready to accept a connection.
     * @return {string}
     */

  }, {
    key: "EDGE_NODE_READY_TO_ACCEPT_CONNECTION",
    get: function get() {
      return 'edge-node-ready-to-accept-connection';
    }
    /**
     * Web RTC measurement with payload created from {RTCPeerConnection.getStats}
     * @return {string}
     */

  }, {
    key: "WEB_RTC_MEASUREMENT",
    get: function get() {
      return 'web-rtc-measurement';
    }
    /**
     * Event requesting Web RTC measurement from {RTCPeerConnection.getStats}
     * @return {string}
     */

  }, {
    key: "REQUEST_WEB_RTC_MEASUREMENT",
    get: function get() {
      return 'request-web-rtc-measurement';
    }
    /**
     * Event of network RTT with payload {number} in millisecond
     * @return {string}
     */

  }, {
    key: "ROUND_TRIP_TIME_MEASUREMENT",
    get: function get() {
      return 'round-trip-time-measurement';
    }
    /**
     * Event of webrtc client connected
     * @return {string}
     */

  }, {
    key: "WEBRTC_CLIENT_CONNECTED",
    get: function get() {
      return 'webrtc-client-connected';
    }
    /**
     * Event of webrtc RTT with payload {number} in millisecond
     * @return {string}
     */

  }, {
    key: "WEBRTC_ROUND_TRIP_TIME_MEASUREMENT",
    get: function get() {
      return 'webrtc-round-trip-time-measurement';
    }
    /**
     * Final report that should be sent up to the backend with a report of all measurement
     * @return {string}
     */

  }, {
    key: "REPORT_MEASUREMENT",
    get: function get() {
      return 'report-measurement';
    }
    /**
     * Event fired when the current location/data center has no free allocations for this edge node
     * and result in the edge node is queued until required capacity in the datacenter is available.
     * @returns {string}
     */

  }, {
    key: "SERVER_OUT_OF_CAPACITY",
    get: function get() {
      return 'server-out-of-capacity';
    }
    /**
     * Event fired when the peer connection has been selected and the system know how it is connected to the backend.
     * @returns {string}
     */

  }, {
    key: "PEER_CONNECTION_SELECTED",
    get: function get() {
      return 'peer-connection-selected';
    }
    /**
     * Event fired when the stream is connected to the backend and the consumer receiving a video stream.
     * @returns {string}
     */

  }, {
    key: "STREAM_CONNECTED",
    get: function get() {
      return 'stream-connected';
    }
    /**
     * Event fired when the stream is disconnected from the backend and no video or no audio is available.
     * @return {string}
     */

  }, {
    key: "STREAM_DISCONNECTED",
    get: function get() {
      return 'stream-disconnected';
    }
    /**
     * Event that is fired when the stream enters an unreachable and none recoverable state.
     * @return {string}
     */

  }, {
    key: "STREAM_UNREACHABLE",
    get: function get() {
      return 'stream-unreachable';
    }
    /**
     * Event that is fired when the edge node crashes.
     * @return {string}
     */

  }, {
    key: "EDGE_NODE_CRASHED",
    get: function get() {
      return 'edge-node-crashed';
    }
    /**
     * Backend signal the stream are in progress to be terminated.
     * @returns {string}
     */

  }, {
    key: "STREAM_TERMINATED",
    get: function get() {
      return 'stream-terminated';
    }
    /**
     * Backend signal the stream are paused now.
     * @returns {string}
     */

  }, {
    key: "STREAM_PAUSED",
    get: function get() {
      return 'stream-paused';
    }
    /**
     * Backend signal the stream are resumed now.
     * @returns {string}
     */

  }, {
    key: "STREAM_RESUMED",
    get: function get() {
      return 'stream-resumed';
    }
    /**
     * Event fired when the stream is reloaded during auto recovery process from an error.
     * @return {string}
     */

  }, {
    key: "STREAM_RELOADED",
    get: function get() {
      return 'stream-reloaded';
    }
    /**
     * Event fired when the video stream started playing (resume from paused or started)
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_PLAYING",
    get: function get() {
      return 'stream-video-playing';
    }
    /**
     * Event fired the event oncanplay is happen on the video DOM element after the tracks has been added.
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_CAN_PLAY",
    get: function get() {
      return 'stream-video-can-play';
    }
    /**
     * Event fired when the video is available and can be played.
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_AVAILABLE",
    get: function get() {
      return 'stream-video-available';
    }
    /**
     * Event fired when the video is not longer available.
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_UNAVAILABLE",
    get: function get() {
      return 'stream-video-unavailable';
    }
    /**
     * Event fired when the video is missing but not certainly unavailable.
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_MISSING",
    get: function get() {
      return 'stream-video-missing';
    }
    /**
     * Event fired when a user interaction is required in order to start video playing
     * @return {string}
     */

  }, {
    key: "REQUIRE_USER_PLAY_INTERACTION",
    get: function get() {
      return 'require-user-play-interaction';
    }
    /**
     * Event fired when a thumbnail screenshot of the video has been created.
     * @returns {string}
     */

  }, {
    key: "STREAM_VIDEO_SCREENSHOT",
    get: function get() {
      return 'stream-video-screenshot';
    }
    /**
     * Event fires when a black screen occurs on the user viewport
     * @return {string}
     */

  }, {
    key: "STREAM_BLACK_SCREEN",
    get: function get() {
      return 'stream-black-screen';
    }
    /**
     * Event fires on first user interaction with audio codec
     * @return {string}
     */

  }, {
    key: "STREAM_AUDIO_CODEC",
    get: function get() {
      return 'stream-audio-codec';
    }
    /**
     * Event fires on first user interaction with video codec
     * @return {string}
     */

  }, {
    key: "STREAM_VIDEO_CODEC",
    get: function get() {
      return 'stream-video-codec';
    }
    /**
     * Event fired when the user interact with a running stream.
     * @return {string}
     */

  }, {
    key: "USER_INTERACTION",
    get: function get() {
      return 'user-interaction';
    }
    /**
     * Event fired when receiving emulator configuration during initialization of P2P connection
     * @returns {string}
     */

  }, {
    key: "EMULATOR_CONFIGURATION",
    get: function get() {
      return 'emulator-configuration';
    }
    /**
     * Event fired when the stream quality rating has been updated.
     * @return {string}
     */

  }, {
    key: "STREAM_QUALITY_RATING",
    get: function get() {
      return 'stream-quality-rating';
    }
    /**
     * Event fired when the audio is available and can be un-muted.
     * @return {string}
     */

  }, {
    key: "STREAM_AUDIO_AVAILABLE",
    get: function get() {
      return 'stream-audio-available';
    }
    /**
     * Event fired when the audio is not longer available.
     * @return {string}
     */

  }, {
    key: "STREAM_AUDIO_UNAVAILABLE",
    get: function get() {
      return 'stream-audio-unavailable';
    }
    /**
     * Event fired when the audio unmute action paused the video
     * @return {string}
     */

  }, {
    key: "STREAM_AUDIO_UNMUTE_ERROR",
    get: function get() {
      return 'stream-audio-unmute-error';
    }
    /**
     * Report that should be sent up to the backend from user clicked play until stream video is playing
     * @return {string}
     */

  }, {
    key: "STREAM_LOADING_TIME",
    get: function get() {
      return 'stream-loading-time';
    }
    /**
     * Event fired when the webrtc video stream is available and can be played by the browser
     * @return {string}
     */

  }, {
    key: "STREAM_WEBRTC_READY",
    get: function get() {
      return 'stream-webrtc-ready';
    }
    /**
     * Event fired when the emulator is ready and first input lag fix has been applied.
     * @return {string}
     */

  }, {
    key: "STREAM_EMULATOR_READY",
    get: function get() {
      return 'stream-emulator-ready';
    }
    /**
     * Event fired when the video stream is available and "play" button can be displayed for the end user,
     * this will only happen after both STREAM_WEBRTC_READY and STREAM_EMULATOR_READY has been received.
     * @return {string}
     */

  }, {
    key: "STREAM_READY",
    get: function get() {
      return 'stream-ready';
    }
    /**
     * Event fired when User Event Report is submitted
     * @return {string}
     */

  }, {
    key: "USER_EVENT_REPORT",
    get: function get() {
      return 'user-event-report';
    }
    /**
     * Event fired when the user starts playing the game
     * @return {string}
     */

  }, {
    key: "USER_STARTS_PLAYING",
    get: function get() {
      return 'user-starts-playing';
    }
    /**
     * Custom moment event send by moment event detector to SDK.
     * @return {string}
     */

  }, {
    key: "MOMENT_DETECTOR_EVENT",
    get: function get() {
      return 'moment-detector-event';
    }
    /**
     * Event fired many times during a game session after (re)evaluation of the predicted game experience.
     * @return {string}
     */

  }, {
    key: "PREDICTED_GAME_EXPERIENCE",
    get: function get() {
      return 'predicted-game-experience';
    }
    /**
     * Event fired when the new edgeWorker is detected by StreamingEvent handler.
     * @return {string}
     */

  }, {
    key: "NEW_EDGE_WORKER",
    get: function get() {
      return 'new-edge-worker';
    }
    /**
     * Event fired when the new edge node is detected by StreamingEvent handler.
     * @return {string}
     */

  }, {
    key: "NEW_EDGE_NODE",
    get: function get() {
      return 'new-edge-node';
    }
    /**
     * Event fired by StreamingEvent when the edge node has been destroyed.
     * @return {string}
     */

  }, {
    key: "DESTROY_EDGE_NODE",
    get: function get() {
      return 'destroy-edge-node';
    }
    /**
     * Event fired at the end of the stream with the collected measurement report
     * @return {string}
     */

  }, {
    key: "CLASSIFICATION_REPORT",
    get: function get() {
      return 'classification-report';
    }
    /**
     * Get EventEmitter for a specific Edge Node Id.
     * This will automatically create a new Event emitter if missing.
     * @param {string} edgeNodeId
     * @return {ExtendedEventEmitter}
     */

  }, {
    key: "edgeNode",
    value: function edgeNode(edgeNodeId) {
      if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
        edgeNodeEventEmitter[edgeNodeId] = new ExtendedEventEmitter(edgeNodeId);
        this.emit(StreamingEvent.NEW_EDGE_NODE, edgeNodeId);
      }

      return edgeNodeEventEmitter[edgeNodeId];
    }
    /**
     * Get list of edge nodes.
     * @return {string[]}
     */

  }, {
    key: "getEdgeNodes",
    value: function getEdgeNodes() {
      return (0, _keys.default)(edgeNodeEventEmitter);
    }
    /**
     * Destroy all the EventEmitter for a specific edge node and force unsubscribe all listeners
     * that are subscribed for edge node events.
     * @param {string} edgeNodeId
     * @return {EventEmitter}
     */

  }, {
    key: "destroyEdgeNode",
    value: function destroyEdgeNode(edgeNodeId) {
      var emitter = edgeNodeEventEmitter[edgeNodeId];

      if (emitter) {
        delete edgeNodeEventEmitter[edgeNodeId];
        emitter.removeAllListeners();
        this.emit(StreamingEvent.DESTROY_EDGE_NODE, edgeNodeId);
      }
    }
    /**
     *
     * @param {string} event
     * @param {function} callback
     */

  }, {
    key: "on",
    value: function on(event, callback) {
      globalEventEmitter.on(event, callback);
      return this;
    }
    /**
     *
     * @param {string} event
     * @param {function} callback
     */

  }, {
    key: "once",
    value: function once(event, callback) {
      globalEventEmitter.once(event, callback);
      return this;
    }
    /**
     *
     * @param {string} event
     * @param {function} callback
     */

  }, {
    key: "off",
    value: function off(event, callback) {
      globalEventEmitter.off(event, callback);
      return this;
    }
    /**
     * Emit an event to the global scope and all edge node scopes.
     * @param {string} event
     * @param {*} data
     */

  }, {
    key: "emit",
    value: function emit(event, data) {
      globalEventEmitter.emit(event, data);

      for (var edgeNodeId in edgeNodeEventEmitter) {
        if (edgeNodeEventEmitter[edgeNodeId]) {
          edgeNodeEventEmitter[edgeNodeId]._emit(event, data);
        }
      }
    }
  }]);
  return StreamingEvent;
}();

exports.default = StreamingEvent;