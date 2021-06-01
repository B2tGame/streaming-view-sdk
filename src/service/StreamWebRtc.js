import StreamingEvent from '../StreamingEvent';
import WebRtcConnectionClient from './WebRtcConnectionClient';

//TODO: reconnect on connection lost

/**
 * WebRtc connection and communicate with the backend
 */
export default class StreamWebRtc {
  static get DATA_CHANNEL_NAME() {
    return 'streaming-webrtc-server';
  }

  static get SERVER_HOST() {
    return 'http://192.168.38.104:5022';
    // return 'http://localhost:5022';
  }

  /**
   * @param {number} pingInterval
   * @param {string|undefined} edgeNodeId
   */
  constructor(pingInterval = 500, edgeNodeId = undefined) {
    this.pingInterval = pingInterval;
    this.edgeNodeId = edgeNodeId;

    this.peerConnection = undefined;
    new WebRtcConnectionClient()
      .createConnection({
        beforeAnswer: this.beforeAnswer,
        host: StreamWebRtc.SERVER_HOST
      })
      .then((peerConnection) => {
        this.peerConnection = peerConnection;
      });

    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STREAM_UNREACHABLE, this.close);
  }

  beforeAnswer = (peerConnection) => {
    let dataChannel = null;
    let interval = null;
    let sequenceId = 0;
    const pingInterval = this.pingInterval;

    function onMessage({ data }) {
      const { type, timestamp, sequenceId } = JSON.parse(data);
      console.log({ type, timestamp, sequenceId });
      if (type === 'pong') {
        const sendTime = Math.trunc(timestamp);
        const rtt = Date.now() - sendTime;
        console.log({ rtt: rtt });
        StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
      }
    }

    function onDataChannel({ channel }) {
      if (channel.label !== StreamWebRtc.DATA_CHANNEL_NAME) {
        return;
      }

      dataChannel = channel;
      dataChannel.addEventListener('message', onMessage);

      interval = setInterval(() => {
        dataChannel.send(
          JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
            sequenceId: sequenceId++ // auto incremental counter to follow if the order of the packages are in the correct order
          })
        );
      }, pingInterval);
    }

    peerConnection.addEventListener('datachannel', onDataChannel);

    // This is a hack so that we can get a callback when the
    // RTCPeerConnection is closed. In the future, we can subscribe to
    // "connectionstatechange" events.
    //TODO: check this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);
    //TODO: check JsepProtocol._handlePeerConnectionStateChange
    const { close } = peerConnection;
    peerConnection.close = function () {
      if (dataChannel) {
        dataChannel.removeEventListener('message', onMessage);
      }
      if (interval) {
        clearInterval(interval);
      }
      return close.apply(this, arguments);
    };
  };

  close = () => {
    if (this.peerConnection) {
      this.peerConnection.close();
      StreamingEvent.edgeNode(this.edgeNodeId).off(StreamingEvent.STREAM_UNREACHABLE, this.close);
      this.peerConnection = undefined;
    }
  };
}
