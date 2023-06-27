import * as StreamingEvent from '../StreamingEvent';
import axios from 'axios';

type LogEvent = {
  edgeNodeId: string;
  name: 'sdk';
  timestamp: string;
  type: 'log';
  message: string;
};

export type LogQueueService = ReturnType<typeof LogQueueFactory>;

/**
 * Collect and send logs from SDK directly to the Service Coordinator.
 *
 * @param edgeNodeId
 * @param apiEndpoint
 * @param userId
 * @param userAuthToken
 * @param streamingViewId
 *
 */
export default function LogQueueFactory(
  edgeNodeId: string,
  apiEndpoint: string,
  userId: string,
  userAuthToken: string,
  streamingViewId: string
) {
  const endpoint = `${apiEndpoint}/api/streaming-games/edge-node/log`;

  let logQueue: LogEvent[] = [];
  let seqId = 0;

  /*
   */
  function onEvent(eventType: string, payload: any) {
    payload = typeof payload === 'object' ? payload : { data: payload };
    payload.streamingViewId = streamingViewId;
    payload.event = eventType;
    payload.seqId = seqId++;
    payload.userId = userId;

    logQueue.push({
      edgeNodeId,
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
  const timer = window.setInterval(sendQueue, 10000);

  /*
   */
  function destroy() {
    window.window.clearInterval(timer);
    window.removeEventListener('beforeunload', sendQueue);
    window.removeEventListener('visibilitychange', sendQueue);
    sendQueue();
  }

  return { destroy };
}
