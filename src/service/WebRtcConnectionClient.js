import parseUrl from 'url-parse';
import axios from 'axios';
import { RTCSessionDescription, RTCPeerConnection } from 'wrtc';

/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */
export default class WebRtcConnectionClient {
  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  static getIceConfiguration = (host) => {
    const hostname = parseUrl(host).hostname;
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
   * @param {[]} iceServers
   * @param {string} id
   */
  static createPeerConnection = (host, iceServers, id) => {
    const options = { sdpSemantics: 'unified-plan' };
    //console.log('createPeerConnection:', iceServers);
    options.iceServers = iceServers.length ? iceServers : [WebRtcConnectionClient.getIceConfiguration(host)];
    options.iceTransportPolicy = 'relay';
    const peerConnection = new RTCPeerConnection(options);

    const onIceCandidateError = (event) => {
      console.log('onIceCandidateError was called with event:', event);
      // if (event.errorCode >= 300 && event.errorCode <= 699) {
      //   // STUN errors are in the range 300-699. See RFC 5389, section 15.6
      //   // for a list of codes. TURN adds a few more error codes; see
      //   // RFC 5766, section 15 for details.
      // } else if (event.errorCode >= 700 && event.errorCode <= 799) {
      //   // Server could not be reached; a specific error number is
      //   // provided but these are not yet specified.
      // }
    };
    const onConnectionStateChange = () => {
      // console.log('peerConnection.connectionState=', peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected') {
        axios.delete(`${host}/connections/${id}`).catch((error) => {
          console.log(error);
        });
        peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
        peerConnection.removeEventListener('onicecandidateerror', onIceCandidateError);
      }
    };
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
    peerConnection.addEventListener('onicecandidateerror', onIceCandidateError);

    return peerConnection;
  };

  static createConnection = (options = {}) => {
    const createOptions = {
      beforeAnswer() {},
      stereo: false,
      ...options
    };
    const { host, iceServersName, iceServersCandidates, beforeAnswer } = createOptions;
    let remotePeerConnectionId = undefined;
    let peerConnection = undefined;
    return axios
      .post(`${host}/connections`)
      .then((response) => {
        const remotePeerConnection = response.data || {};
        remotePeerConnectionId = remotePeerConnection.id;
        peerConnection = WebRtcConnectionClient.createPeerConnection(host, iceServersCandidates, remotePeerConnectionId);
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
