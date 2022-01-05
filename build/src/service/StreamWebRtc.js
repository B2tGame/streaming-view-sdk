"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _WebRtcConnectionClient = _interopRequireDefault(require("./WebRtcConnectionClient"));

/**
 * StreamWebRtc is a WebRtc connection class to communicate with the backend
 */
class StreamWebRtc extends _eventemitter.default {
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
   * @param {number} pingInterval
   */


  constructor(host) {
    let _pingInterval = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : StreamWebRtc.WEBRTC_PING_INTERVAL;

    super();

    this.beforeAnswer = peerConnection => {
      let dataChannel = undefined;
      let interval = undefined;
      let sequenceId = 0;
      const pingInterval = this.pingInterval;

      const onMessage = _ref => {
        let {
          data
        } = _ref;
        const {
          type,
          timestamp
        } = JSON.parse(data);

        if (type === 'pong') {
          const sendTime = Math.trunc(timestamp);
          const rtt = Date.now() - sendTime;
          this.emit(_StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
        }
      };

      const onDataChannel = _ref2 => {
        let {
          channel
        } = _ref2;

        if (channel.label !== StreamWebRtc.DATA_CHANNEL_NAME) {
          return;
        }

        dataChannel = channel;
        dataChannel.addEventListener('message', onMessage);
        interval = setInterval(() => {
          if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now(),
              sequenceId: sequenceId++ // incremental counter to be able to detect out of order or lost packages

            }));
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
            this.emit(_StreamingEvent.default.WEBRTC_CLIENT_CONNECTED);
            break;

          default:
        }
      };

      peerConnection.addEventListener('datachannel', onDataChannel);
      peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
    };

    this.close = () => {
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = undefined;
      }
    };

    this.host = host;
    this.pingInterval = _pingInterval;
    this.peerConnection = undefined;

    _WebRtcConnectionClient.default.createConnection({
      beforeAnswer: this.beforeAnswer,
      host: this.host
    }).then(peerConnection => {
      this.peerConnection = peerConnection;
    });
  }

}

exports.default = StreamWebRtc;

StreamWebRtc.calculateRoundTripTimeStats = values => {
  const stats = {
    rtt: 0,
    standardDeviation: 0
  };
  const n = values.length;

  if (n < 1) {
    return stats;
  }

  stats.rtt = values.reduce((a, b) => a + b, 0) / n;
  stats.standardDeviation = Math.sqrt(values.reduce((cum, item) => cum + Math.pow(item - stats.rtt, 2), 0) / n);
  return stats;
};