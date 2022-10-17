import axios from 'axios';

/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */
export default class WebRtcConnectionClient {
  /**
   *
   * @param {string} host
   * @param {[]} iceServers
   * @param {string} id
   */
  static createPeerConnection = (host, iceServers, id) => {
    const options = {
      sdpSemantics: 'unified-plan',
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      //iceTransportPolicy: 'relay',
    };
    const peerConnection = new RTCPeerConnection(options);

    const onConnectionStateChange = () => {
      if (peerConnection.connectionState === 'disconnected') {
        axios.delete(`${host}/connections/${id}`).catch((error) => {
          console.error(error);
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
      ...options,
    };
    const { host, iceServersCandidates, beforeAnswer } = createOptions;
    let remotePeerConnectionId = undefined;
    let peerConnection = undefined;

    const waitUntilIceGatheringStateComplete = () =>
      new Promise((resolve, reject) => {
        if (peerConnection.iceGatheringState === 'complete') {
          resolve(peerConnection);
        }

        const onIceCandidate = (candidate) => {
          if (candidate.candidate !== null && candidate.candidate !== undefined) {
            clearTimeout(timeout);
            peerConnection.removeEventListener('icecandidate', onIceCandidate);
            resolve(peerConnection);
          }
        };

        const timeout = setTimeout(() => {
          peerConnection.removeEventListener('icecandidate', onIceCandidate);
          reject('Timed out waiting for host candidates');
        }, 10000);
        peerConnection.addEventListener('icecandidate', onIceCandidate);
      });

    return axios
      .post(`${host}/connections`)
      .then((response) => {
        const remotePeerConnection = response.data || {};
        remotePeerConnectionId = remotePeerConnection.id;
        peerConnection = WebRtcConnectionClient.createPeerConnection(host, iceServersCandidates, remotePeerConnectionId);
        return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
      })
      .then(() => {
        return beforeAnswer(peerConnection);
      })
      .then(() => peerConnection.createAnswer())
      .then((originalAnswer) => {
        return peerConnection.setLocalDescription(
          new RTCSessionDescription({
            type: 'answer',
            sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp,
          })
        );
      })
      .then(() => waitUntilIceGatheringStateComplete())
      .then(() => {
        return axios(`${host}/connections/${remotePeerConnectionId}/remote-description`, {
          method: 'POST',
          data: JSON.stringify(peerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then(() => {
        return peerConnection;
      })
      .catch((error) => {
        if (peerConnection) {
          peerConnection.close();
          peerConnection = null;
        }
        throw error;
      });
  };
}
