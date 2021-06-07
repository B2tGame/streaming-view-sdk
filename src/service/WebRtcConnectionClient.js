const urlParse = require('url-parse');
const axios = require('axios').default;
const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const { RTCSessionDescription } = require('wrtc');

const TIME_TO_HOST_CANDIDATES = 1000;

export default class WebRtcConnectionClient {
  constructor(options = {}) {
    this.options = {
      RTCPeerConnection: DefaultRTCPeerConnection,
      clearTimeout,
      host: '',
      setTimeout,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      ...options
    };

    return this;
  }

  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  getIceConfiguration(host) {
    const hostname = urlParse(host).hostname;
    const endpoint = `turn:${hostname}:3478`;

    return {
      urls: [`${endpoint}?transport=udp`, `${endpoint}?transport=tcp`],
      username: 'webclient',
      credential: 'webclient',
      ttl: 86400
    };
  }

  /**
   *
   * @param {string} host
   * @param {string} id
   */
  createPeerConnection = (host, id) => {
    const options = { sdpSemantics: 'unified-plan' };
    options.iceServers = [this.getIceConfiguration(host)];
    options.iceTransportPolicy = 'relay';
    const { RTCPeerConnection } = this.options;
    const peerConnection = new RTCPeerConnection(options);

    const onConnectionStateChange = () => {
      if (peerConnection.connectionState === 'disconnected') {
        axios.delete(`${host}/connections/${id}`).catch((error) => {
          console.log(error);
        });
        peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
      }
    };
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);

    return peerConnection;
  };

  createConnection = (options = {}) => {
    const createOptions = {
      beforeAnswer() {},
      stereo: false,
      ...options
    };
    const { host } = createOptions;
    let remotePeerConnectionId = undefined;
    let peerConnection = undefined;
    return axios
      .post(`${host}/connections`)
      .then((response) => {
        const remotePeerConnection = response.data || {};
        remotePeerConnectionId = remotePeerConnection.id;
        peerConnection = this.createPeerConnection(host, remotePeerConnectionId);
        return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
      })
      .then(() => createOptions.beforeAnswer(peerConnection))
      .then(() => peerConnection.createAnswer())
      .then((originalAnswer) =>
        peerConnection.setLocalDescription(
          new RTCSessionDescription({
            type: 'answer',
            sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
          })
        )
      )
      .then(() =>
        axios(`${host}/connections/${remotePeerConnectionId}/remote-description`, {
          method: 'POST',
          data: JSON.stringify(peerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
      .then(() => peerConnection)
      .catch((error) => {
        if (peerConnection) {
          peerConnection.close();
        }
        throw error;
      });
  };
}
