const axios = require('axios').default;
const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const { RTCSessionDescription } = require('wrtc');

const TIME_TO_HOST_CANDIDATES = 1000;

export default class WebrtcConnectionClient {
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
   *
   * @param {string} host
   * @param {string} id
   */
  createPeerConnection = (host, id) => {
    //TODO: find out how to handle proxy case
    const options = { sdpSemantics: 'unified-plan' };
    if (window.location.search === '?proxy') {
      options.iceServers = [
        {
          username: '1615555670:appland',
          credential: 'dYgxMHKLcGSjRTRhvPFXDn2YSPY=',
          ttl: 86400,
          urls: ['turn:143.131.179.76:36995?transport=udp']
        }
      ];
      options.iceTransportPolicy = 'relay';
    }
    const { RTCPeerConnection } = this.options;
    const peerConnection = new RTCPeerConnection(options);

    // This is a hack so that we can get a callback when the
    // RTCPeerConnection is closed. In the future, we can subscribe to
    // "connectionstatechange" events.
    //TODO: check this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);
    //TODO: check JsepProtocol._handlePeerConnectionStateChange
    peerConnection.close = function () {
      axios.delete(`${host}/connections/${id}`).catch((error) => {
        console.log(error);
      });
      return RTCPeerConnection.prototype.close.apply(this, arguments);
    };

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
        peerConnection.close();
        throw error;
      });
  };
}
