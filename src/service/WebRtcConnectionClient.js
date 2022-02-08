import axios from 'axios';
import { RTCSessionDescription, RTCPeerConnection } from 'wrtc';

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
      iceServers: iceServers,
      iceTransportPolicy: 'relay'
    };
    console.log('RTCPeerConnection options:', options);
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
    const { host, iceServersCandidates, beforeAnswer } = createOptions;
    console.log('WebRtcConnectionClient.createConnection', { host, iceServersCandidates });

    let remotePeerConnectionId = undefined;
    let peerConnection = undefined;

    const waitUntilIceGatheringStateComplete = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        return;
      }
      const deferred = {};
      deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });

      const onIceCandidate = (candidate) => {
        if (candidate.candidate !== null && candidate.candidate !== undefined) {
          clearTimeout(timeout);
          peerConnection.removeEventListener('icecandidate', onIceCandidate);
          deferred.resolve(peerConnection);
        }
      };

      const timeout = setTimeout(() => {
        peerConnection.removeEventListener('icecandidate', onIceCandidate);
        deferred.reject(new Error('Timed out waiting for host candidates'));
      }, 3000);
      peerConnection.addEventListener('icecandidate', onIceCandidate);

      return deferred.promise;
    };

    console.log(`axios POST to: ${host}/connections`);
    return axios
      .post(`${host}/connections`)
      .then((response) => {
        const remotePeerConnection = response.data || {};
        console.log(`remotePeerConnection received form ${host}/connections`, remotePeerConnection);
        remotePeerConnectionId = remotePeerConnection.id;
        peerConnection = WebRtcConnectionClient.createPeerConnection(host, iceServersCandidates, remotePeerConnectionId);

        console.log(`set remotePeerConnection.localDescription as remote description`, remotePeerConnection.localDescription);
        return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
      })
      .then(() => {
        console.log(`setting peerConnection.setRemoteDescription DONE`);
        console.log('peerConnection.connectionState:', peerConnection.connectionState);
        console.log('beforeAnswer; adding ping-pong event handlers');
        return beforeAnswer(peerConnection);
      })
      .then(() => peerConnection.createAnswer())
      .then((originalAnswer) => {
        console.log('peerConnection.createAnswer:', originalAnswer);
        console.log('peerConnection.setLocalDescription');
        return peerConnection.setLocalDescription(
          new RTCSessionDescription({
            type: 'answer',
            sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
          })
        );
      })
      .then(() => waitUntilIceGatheringStateComplete())
      .then(() => {
        console.log(
          `sending answer to: ${host}/connections/${remotePeerConnectionId}/remote-description with peerConnection.localDescription:`,
          peerConnection.localDescription
        );
        return axios(`${host}/connections/${remotePeerConnectionId}/remote-description`, {
          method: 'POST',
          data: JSON.stringify(peerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      })
      .then((response) => {
        console.log('response from server:', response);
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
