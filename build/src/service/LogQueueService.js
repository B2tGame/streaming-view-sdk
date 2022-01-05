"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _axios = _interopRequireDefault(require("axios"));

/**
 * Collect and send logs from SDK directly to the Service Coordinator.
 */
class LogQueueService {
  /**
   * @param {string} edgeNodeId
   * @param {string} apiEndpoint
   * @param {string} userId
   * @param {string} streamingViewId
   */
  constructor(edgeNodeId, apiEndpoint, userId, streamingViewId) {
    this.logQueue = [];
    this.endpoint = "".concat(apiEndpoint, "/api/streaming-games/edge-node/log");
    this.seqId = 0;
    this.streamingViewId = streamingViewId;

    _StreamingEvent.default.edgeNode(edgeNodeId).on('event', (eventType, payload) => {
      payload = typeof payload === 'object' ? payload : {
        data: payload
      };
      payload.streamingViewId = this.streamingViewId;
      payload.event = eventType;
      payload.seqId = this.seqId++;
      payload.userId = userId;
      this.logQueue.push({
        edgeNodeId: edgeNodeId,
        name: 'sdk',
        timestamp: new Date().toISOString(),
        type: 'log',
        message: JSON.stringify(payload)
      });

      if (this.logQueue.length > 25) {
        this.sendQueue();
      }
    });

    this.unloadListener = () => this.sendQueue();

    window.addEventListener('unload', this.unloadListener);
    this.timer = setInterval(() => this.sendQueue(), 10000);
  }
  /**
   * Destroy the LogQueueService and send any message in the queue
   */


  destroy() {
    clearInterval(this.timer);
    window.removeEventListener('unload', this.unloadListener);
    this.sendQueue();
  }
  /**
   * Send the queue as it is now to the backend.
   */


  sendQueue() {
    if (this.logQueue.length) {
      const logQueue = this.logQueue;
      this.logQueue = [];

      if (navigator && navigator.sendBeacon) {
        // Send request if supported via beacon
        navigator.sendBeacon(this.endpoint, JSON.stringify(logQueue));
      } else {
        // otherwise with axios
        _axios.default.post(this.endpoint, logQueue).catch(() => {});
      }
    }
  }

}

exports.default = LogQueueService;