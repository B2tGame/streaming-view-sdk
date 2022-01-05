import url from 'url';
import StreamingEvent from '../StreamingEvent';
import io from 'socket.io-client';
import pako from 'pako'

/**
 * Websocket connection and communicate with the backend
 */
export default class StreamSocket {
  /**
   * Returns Web Socket ping interval number in ms.
   * @return {number}
   */
  static get WEBSOCKET_PING_INTERVAL() {
    return 250;
  }

  static get WEBSOCKET_EMIT_REPORTS_INTERVAL() {
    return StreamSocket.WEBSOCKET_PING_INTERVAL * 10;
  }

  /**
   * @param {string} edgeNodeId
   * @param {string} streamEndpoint
   * @param {string} userId
   * @param {boolean} internalSession
   */
  constructor(edgeNodeId, streamEndpoint, userId, internalSession) {
    const endpoint = url.parse(streamEndpoint);
    this.edgeNodeId = edgeNodeId;
    this.userId = userId;
    this.socket = io(`${endpoint.protocol}//${endpoint.host}`, {
      path: `${endpoint.path}/emulator-commands/socket.io`,
      query: `userId=${userId}&internal=${internalSession ? '1' : '0'}`
    });
    this.reportCache = [];
    this.reportTimer = setInterval(this.emitReports, StreamSocket.WEBSOCKET_EMIT_REPORTS_INTERVAL);

    // Web Socket errors
    this.socket.on('error', (err) => StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.ERROR, err));
    // Preforming and emit RTT to the streaming event bus.
    this.socket.on('pong', (networkRoundTripTime) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, networkRoundTripTime);
    });

    this.socket.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.name === 'emulator-configuration') {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.EMULATOR_CONFIGURATION, message.configuration);
      } else if (message.name === 'emulator-event') {
        switch (message.event) {
          case 'paused': {
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_PAUSED);
            break;
          }
          case 'resumed': {
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_RESUMED);
            break;
          }
          case 'terminated': {
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_UNREACHABLE, 'Edge node status change: terminated');
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_TERMINATED);
            break;
          }
          case 'edge-node-crashed': {
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_UNREACHABLE, 'Edge node status change: edge-node-crashed');
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.EDGE_NODE_CRASHED);
            StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_TERMINATED);
            break;
          }
          default: {
            // Unexpected value
          }
        }
      } else if (message.name === 'moment-detector-event') {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.MOMENT_DETECTOR_EVENT, message.payload || {});
      } else if (message.name === 'emulator-stream' && message.ready) {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_EMULATOR_READY);
      }
    });
    // Send measurement report to the backend.
    StreamingEvent.edgeNode(edgeNodeId)
      .on(StreamingEvent.REPORT_MEASUREMENT, this.onReportMeasurement)
      .on(StreamingEvent.USER_EVENT_REPORT, this.onUserEventReport)
      .on(StreamingEvent.STREAM_UNREACHABLE, this.close);
  }

  onReportMeasurement = (payload) => {
    payload.type = 'report';
    payload.timestamp = Date.now();
    this.reportCache.push(JSON.stringify(payload));
  };

  /**
   * Emits cached report messages
   * @param {bool} isLast
   */
  emitReports = (isLast = false) => {
    if (isLast) {
      clearInterval(this.reportTimer);
    }

    if (this.reportCache.length && this.socket) {
      this.socket.emit(
        'message',
        JSON.stringify({
          type: 'report-bundle',
          timestamp: Date.now(),
          reports: pako.deflate(JSON.stringify([...this.reportCache]))
        })
      );
      this.reportCache = [];
    }
  };

  /**
   * Report user events into supervisor
   * @param {{role: string, eventType: string, value: number, message: string}} payload
   * Example payload structure { role: "player"|"watcher", eventType: "stream-loading-time", value: 12000, message: "User event details"}
   */
  onUserEventReport = (payload) => {
    payload.type = 'report-user-event';
    payload.timestamp = Date.now();
    if (this.socket) {
      this.socket.emit('message', JSON.stringify(payload));
    }
  };

  close = () => {
    if (this.socket) {
      this.emitReports(true);
      this.socket.close();
      StreamingEvent.edgeNode(this.edgeNodeId)
        .off(StreamingEvent.REPORT_MEASUREMENT, this.onReportMeasurement)
        .off(StreamingEvent.USER_EVENT_REPORT, this.onUserEventReport)
        .off(StreamingEvent.STREAM_UNREACHABLE, this.close);
      this.socket = undefined;
    }
  };
}
