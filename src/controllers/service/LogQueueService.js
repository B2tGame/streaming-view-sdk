import StreamingEvent from '../StreamingEvent';
import axios from 'axios';

/**
 * Collect and send logs from SDK directly to the Service Coordinator.
 *
 * @param {string} edgeNodeId
 * @param {string} apiEndpoint
 * @param {string} userId
 * @param {string} userAuthToken
 * @param {string} streamingViewId
 *
 */
export default function LogQueueService(edgeNodeId, apiEndpoint, userId, userAuthToken, streamingViewId) {
  const endpoint = `${apiEndpoint}/api/streaming-games/edge-node/log`;

  let logQueue = [];
  let seqId = 0;

  /*
   */
  function onEvent(eventType, payload) {
    payload = typeof payload === 'object' ? payload : { data: payload };
    payload.streamingViewId = streamingViewId;
    payload.event = eventType;
    payload.seqId = seqId++;
    payload.userId = userId;

    logQueue.push({
      edgeNodeId: edgeNodeId,
      name: 'sdk',
      timestamp: new Date().toISOString(),
      type: 'log',
      message: JSON.stringify(payload),
    });

    if (logQueue.length > 25) {
      sendQueue();
    }
  }

  /*
   */
  function sendQueue() {
    if (!logQueue.length) return;

    const payload = {
      userAuthToken,
      logQueue,
    };

    /*
     * https://xgwang.me/posts/you-may-not-know-beacon/
     */
    if (navigator && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      axios.post(endpoint, payload).catch(console.error);
    }

    logQueue = [];
  }

  StreamingEvent.edgeNode(edgeNodeId).on('event', onEvent);

  window.addEventListener('beforeunload', sendQueue);
  window.addEventListener('visibilitychange', sendQueue);
  const timer = setInterval(sendQueue, 10000);

  /*
   */
  function destroy() {
    clearInterval(timer);
    window.removeEventListener('beforeunload', sendQueue);
    window.removeEventListener('visibilitychange', sendQueue);
    sendQueue();
  }

  return { destroy };
}
