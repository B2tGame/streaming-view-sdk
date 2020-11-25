import url from 'url';
import StreamingEvent from '../StreamingEvent';
import io from 'socket.io-client';

export default class StreamSocket {
  constructor(edgeNodeId, streamEndpoint, userId, internalSession) {
    const endpoint = url.parse(streamEndpoint);
    this.edgeNodeId = edgeNodeId;
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
    StreamingEvent.edgeNode(edgeNodeId)
      .on(StreamingEvent.REPORT_MEASUREMENT, this.onReport)
      .on(StreamingEvent.STREAM_UNREACHABLE, this.close);

  }

  onReport = (payload) => {
    payload.type = 'report';
    payload.timestamp = Date.now();
    if(this.socket) {
      this.socket.emit('message', JSON.stringify(payload));
    }
  }

  close = () => {
    if (this.socket) {
      this.socket.close();
      StreamingEvent.edgeNode(this.edgeNodeId)
        .off(StreamingEvent.REPORT_MEASUREMENT, this.onReport)
        .off(StreamingEvent.STREAM_UNREACHABLE, this.close);
      this.socket = undefined;
    }
  }

}