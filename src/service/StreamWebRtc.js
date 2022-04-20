import EventEmitter from 'eventemitter3';
import StreamingEvent from '../StreamingEvent';
import WebRtcConnectionClient from './WebRtcConnectionClient';

/**
 * StreamWebRtc is a WebRtc connection class to communicate with the backend
 */
export default class StreamWebRtc extends EventEmitter {
  static get DATA_CHANNEL_NAME() {
    return 'streaming-webrtc-server';
  }

  /**
   * Returns WebRtc ping interval number in ms.
   * @return {number}
   */
  static get WEBRTC_PING_INTERVAL() {
    return 25;
  }

  /**
   * @param {string} host
   * @param {{name: string, candidates: []}} iceServers
   * @param {number} pingInterval
   */
  constructor(
    host,
    iceServers = { name: 'default', candidates: [] },
    pingInterval = StreamWebRtc.WEBRTC_PING_INTERVAL,
  ) {
    super();

    this.iceServersName = iceServers.name;
    this.iceServersCandidates = iceServers.candidates;
    this.host = `${host}/${this.iceServersName}`;
    this.pingInterval = pingInterval;
    this.peerConnection = undefined;

    WebRtcConnectionClient.createConnection({
      beforeAnswer: this.beforeAnswer,
      host: this.host,
      iceServersName: this.iceServersName,
      iceServersCandidates: this.iceServersCandidates
    }).then((peerConnection) => {
      this.peerConnection = peerConnection;
    });
  }

  beforeAnswer = (peerConnection) => {
    let dataChannel = undefined;
    let interval = undefined;
    let sequenceId = 0;
    const pingInterval = this.pingInterval;

    const onMessage = ({ data }) => {
      const { type, timestamp } = JSON.parse(data);
      if (type === 'pong') {
        const sendTime = Math.trunc(timestamp);
        const rtt = Date.now() - sendTime;
        this.emit(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
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
              sequenceId: sequenceId++ // incremental counter to be able to detect out of order or lost packages
            })
          );
        }
      }, pingInterval);
    };

    const onConnectionStateChange = () => {
      switch (peerConnection.connectionState) {
        case 'disconnected':
          if (dataChannel) {
            dataChannel.removeEventListener('message', onMessage);
          }
          if (interval) {
            clearInterval(interval);
          }
          peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
          break;
        case 'connected':
          this.emit(StreamingEvent.WEBRTC_CLIENT_CONNECTED);
          break;
        default:
      }
    };

    peerConnection.addEventListener('datachannel', onDataChannel);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
  };

  /**
   * Calculates mean rtt and standard deviation values for the given input
   * @param {number[]} values
   * @return {{rtt: number, standardDeviation: number}}
   */
  static calculateRoundTripTimeStats = (values) => {
    const stats = { rtt: 0, standardDeviation: 0 };
    const n = values.length;
    if (n < 1) {
      return stats;
    }
    stats.rtt = values.reduce((a, b) => a + b, 0) / n;
    stats.standardDeviation = Math.sqrt(values.reduce((cum, item) => cum + Math.pow(item - stats.rtt, 2), 0) / n);

    return stats;
  };

  close = () => {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  };
}
