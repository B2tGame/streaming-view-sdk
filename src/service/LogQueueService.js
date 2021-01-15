import StreamingEvent from '../StreamingEvent';
import axios from 'axios';
import { v4 as uuid } from 'uuid';

/**
 * Collect and send logs from SDK directly to the Service Coordinator.
 */
export default class LogQueueService {
  /**
   * @param {string} edgeNodeId
   * @param {string} apiEndpoint
   * @param {string} userId
   */
  constructor(edgeNodeId, apiEndpoint, userId) {
    this.logQueue = [];
    this.endpoint = `${apiEndpoint}/api/streaming-games/edge-node/log`;
    this.streamingViewId = uuid();
    StreamingEvent.edgeNode(edgeNodeId).on('event', (eventType, payload) => {
      payload = typeof payload === 'object' ? payload : {data: payload};
      payload.streamingViewId = this.streamingViewId;
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
        axios.post(this.endpoint, logQueue).catch(() => {
        });
      }
    }
  }

}
