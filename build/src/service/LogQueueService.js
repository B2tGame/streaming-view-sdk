"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _axios = _interopRequireDefault(require("axios"));

/**
 * Collect and send logs from SDK directly to the Service Coordinator.
 */
var LogQueueService = /*#__PURE__*/function () {
  /**
   * @param {string} edgeNodeId
   * @param {string} apiEndpoint
   * @param {string} userId
   * @param {string} streamingViewId
   */
  function LogQueueService(edgeNodeId, apiEndpoint, userId, streamingViewId) {
    var _this = this;

    (0, _classCallCheck2.default)(this, LogQueueService);
    this.logQueue = [];
    this.endpoint = "".concat(apiEndpoint, "/api/streaming-games/edge-node/log");
    this.seqId = 0;
    this.streamingViewId = streamingViewId;

    _StreamingEvent.default.edgeNode(edgeNodeId).on('event', function (eventType, payload) {
      payload = (0, _typeof2.default)(payload) === 'object' ? payload : {
        data: payload
      };
      payload.streamingViewId = _this.streamingViewId;
      payload.event = eventType;
      payload.seqId = _this.seqId++;
      payload.userId = userId;

      _this.logQueue.push({
        edgeNodeId: edgeNodeId,
        name: 'sdk',
        timestamp: new Date().toISOString(),
        type: 'log',
        message: (0, _stringify.default)(payload)
      });

      if (_this.logQueue.length > 25) {
        _this.sendQueue();
      }
    });

    this.unloadListener = function () {
      return _this.sendQueue();
    };

    window.addEventListener('unload', this.unloadListener);
    this.timer = setInterval(function () {
      return _this.sendQueue();
    }, 10000);
  }
  /**
   * Destroy the LogQueueService and send any message in the queue
   */


  (0, _createClass2.default)(LogQueueService, [{
    key: "destroy",
    value: function destroy() {
      clearInterval(this.timer);
      window.removeEventListener('unload', this.unloadListener);
      this.sendQueue();
    }
    /**
     * Send the queue as it is now to the backend.
     */

  }, {
    key: "sendQueue",
    value: function sendQueue() {
      if (this.logQueue.length) {
        var logQueue = this.logQueue;
        this.logQueue = [];

        if (navigator && navigator.sendBeacon) {
          // Send request if supported via beacon
          navigator.sendBeacon(this.endpoint, (0, _stringify.default)(logQueue));
        } else {
          // otherwise with axios
          _axios.default.post(this.endpoint, logQueue).catch(function () {});
        }
      }
    }
  }]);
  return LogQueueService;
}();

exports.default = LogQueueService;