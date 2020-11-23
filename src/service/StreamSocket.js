import url from 'url';
import StreamingEvent from '../StreamingEvent';
import io from 'socket.io-client';

export default class StreamSocket {
  constructor(edgeNodeId, streamEndpoint, userId, internalSession) {
    const endpoint = url.parse(streamEndpoint);
    this.socket = io(`${endpoint.protocol}//${endpoint.host}`, {
      path: `${endpoint.path}/emulator-commands/socket.io`,
      query: `userId=${userId}&internal=${internalSession ? '1' : '0'}`,
    });

    // Web Socket errors
    this.socket.on('error', (err) => StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.ERROR, err));

    // Preforming and emit RTT to the streaming event bus.
    this.socket.on('pong', (networkRoundTripTime) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, networkRoundTripTime);
    });

    // Send measurement report to the backend.
    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.REPORT_MEASUREMENT, (payload) => {
      payload.type = 'report';
      payload.timestamp = Date.now();
      this.socket.emit('message', JSON.stringify(payload));
    });

    // Send state change event to the backend.
    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STATE_CHANGE, (payload) => {
      this.socket.emit(
        'message',
        JSON.stringify({
          type: payload.type,
          name: 'client-log',
          state: payload.state,
          timestamp: Date.now(),
        }),
      );
    });
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

}