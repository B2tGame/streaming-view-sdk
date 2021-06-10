import StreamingEvent from '../StreamingEvent';
import WebRtcConnectionClient from './WebRtcConnectionClient';

/**
 * StreamWebRtc is a WebRtc connection class to communicate with the backend
 */
export default class StreamWebRtc {
  static get DATA_CHANNEL_NAME() {
    return 'streaming-webrtc-server';
  }

  /**
   * @param {string} host
   * @param {number} pingInterval
   * @param {string|undefined} edgeNodeId
   */
  constructor(host, pingInterval = 500, edgeNodeId = undefined) {
    this.host = host;
    this.pingInterval = pingInterval;
    this.edgeNodeId = edgeNodeId;
    this.peerConnection = undefined;

    WebRtcConnectionClient.createConnection({
      beforeAnswer: this.beforeAnswer,
      host: this.host
    }).then((peerConnection) => {
      this.peerConnection = peerConnection;
    });

    if (this.edgeNodeId) {
      StreamingEvent.edgeNode(this.edgeNodeId).on(StreamingEvent.STREAM_UNREACHABLE, this.close);
    }
  }

  beforeAnswer = (peerConnection) => {
    let dataChannel = undefined;
    let interval = undefined;
    let sequenceId = 0;
    const pingInterval = this.pingInterval;

    const onMessage = ({ data }) => {
      const { type, timestamp, sequenceId } = JSON.parse(data);
      console.log('pong', { type, timestamp, sequenceId });
      if (type === 'pong') {
        const sendTime = Math.trunc(timestamp);
        const rtt = Date.now() - sendTime;

        console.log({ rtt: rtt });

        if (this.edgeNodeId) {
          StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
        } else {
          StreamingEvent.edgeWorker(this.host).emit(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
        }
      }
    };

    const onDataChannel = ({ channel }) => {
      if (channel.label !== StreamWebRtc.DATA_CHANNEL_NAME) {
        return;
      }
      dataChannel = channel;
      dataChannel.addEventListener('message', onMessage);
      interval = setInterval(() => {
        if (dataChannel.readyState === 'open') {
          dataChannel.send(
            JSON.stringify({
              type: 'ping',
              timestamp: Date.now(),
              sequenceId: sequenceId++ // auto incremental counter to follow if the order of the packages are in the correct order
            })
          );
        }
      }, pingInterval);
    };

    const onConnectionStateChange = () => {
      if (peerConnection.connectionState === 'disconnected') {
        if (dataChannel) {
          dataChannel.removeEventListener('message', onMessage);
        }
        if (interval) {
          clearInterval(interval);
        }
        peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
      }
    };

    peerConnection.addEventListener('datachannel', onDataChannel);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
  };

  close = () => {
    if (this.peerConnection) {
      this.peerConnection.close();
      if (this.edgeNodeId) {
        StreamingEvent.edgeNode(this.edgeNodeId).off(StreamingEvent.STREAM_UNREACHABLE, this.close);
      }
      this.peerConnection = undefined;
    }
  };
}
