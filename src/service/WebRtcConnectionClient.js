const urlParse = require('url-parse');
const axios = require('axios').default;
const RTCPeerConnection = require('wrtc').RTCPeerConnection;
const { RTCSessionDescription } = require('wrtc');

/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */
export default class WebRtcConnectionClient {
  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  static getIceConfiguration = (host) => {
    const hostname = urlParse(host).hostname;
    const endpoint = `turn:${hostname}:3478`;

    return {
      urls: [`${endpoint}?transport=udp`, `${endpoint}?transport=tcp`],
      username: 'webclient',
      credential: 'webclient',
      ttl: 86400
    };
  };

  /**
   *
   * @param {string} host
   * @param {string} id
   */
  static createPeerConnection = (host, id) => {
    const options = { sdpSemantics: 'unified-plan' };
    options.iceServers = [
      // WebRtcConnectionClient.getIceConfiguration(host),
      // {
      //   username: '1638271361:prj_40FJdijqV0Bx4hT2sY09Ll',
      //   credential: 'oaeeHDaoSv+tlUi0hNpLLPKhpUM=',
      //   url: 'turn:globalturn.subspace.com:3478?transport=udp',
      //   urls: 'turn:globalturn.subspace.com:3478?transport=udp'
      // },
      // {
      //   username: '1638271361:prj_40FJdijqV0Bx4hT2sY09Ll',
      //   credential: 'oaeeHDaoSv+tlUi0hNpLLPKhpUM=',
      //   url: 'turn:globalturn.subspace.com:3478?transport=tcp',
      //   urls: 'turn:globalturn.subspace.com:3478?transport=tcp'
      // },
      // {
      //   username: '1638271361:prj_40FJdijqV0Bx4hT2sY09Ll',
      //   credential: 'oaeeHDaoSv+tlUi0hNpLLPKhpUM=',
      //   url: 'turns:globalturn.subspace.com:5349?transport=udp',
      //   urls: 'turns:globalturn.subspace.com:5349?transport=udp'
      // },
      // {
      //   username: '1638271361:prj_40FJdijqV0Bx4hT2sY09Ll',
      //   credential: 'oaeeHDaoSv+tlUi0hNpLLPKhpUM=',
      //   url: 'turns:globalturn.subspace.com:5349?transport=tcp',
      //   urls: 'turns:globalturn.subspace.com:5349?transport=tcp'
      // },
      // {
      //   username: '1638271361:prj_40FJdijqV0Bx4hT2sY09Ll',
      //   credential: 'oaeeHDaoSv+tlUi0hNpLLPKhpUM=',
      //   url: 'turns:globalturn.subspace.com:443?transport=tcp',
      //   urls: 'turns:globalturn.subspace.com:443?transport=tcp'
      // }
    ];
    options.iceTransportPolicy = 'relay';
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

  static createConnection = (options = {}) => {
    const createOptions = {
      beforeAnswer() {},
      stereo: false,
      ...options
    };
    const { host, beforeAnswer } = createOptions;
    let remotePeerConnectionId = undefined;
    let peerConnection = undefined;
    return axios
      .post(`${host}/connections`)
      .then((response) => {
        const remotePeerConnection = response.data || {};
        remotePeerConnectionId = remotePeerConnection.id;
        peerConnection = WebRtcConnectionClient.createPeerConnection(host, remotePeerConnectionId);
        return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
      })
      .then(() => beforeAnswer(peerConnection))
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
