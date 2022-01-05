"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const urlParse = require('url-parse');

const axios = require('axios').default;

const RTCPeerConnection = require('wrtc').RTCPeerConnection;

const {
  RTCSessionDescription
} = require('wrtc');
/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */


class WebRtcConnectionClient {}

exports.default = WebRtcConnectionClient;

WebRtcConnectionClient.getIceConfiguration = host => {
  const hostname = urlParse(host).hostname;
  const endpoint = "turn:".concat(hostname, ":3478");
  return {
    urls: ["".concat(endpoint, "?transport=udp"), "".concat(endpoint, "?transport=tcp")],
    username: 'webclient',
    credential: 'webclient',
    ttl: 86400
  };
};

WebRtcConnectionClient.createPeerConnection = (host, id) => {
  const options = {
    sdpSemantics: 'unified-plan'
  };
  options.iceServers = [WebRtcConnectionClient.getIceConfiguration(host)];
  options.iceTransportPolicy = 'relay';
  const peerConnection = new RTCPeerConnection(options);

  const onConnectionStateChange = () => {
    if (peerConnection.connectionState === 'disconnected') {
      axios.delete("".concat(host, "/connections/").concat(id)).catch(error => {
        console.log(error);
      });
      peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
    }
  };

  peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
  return peerConnection;
};

WebRtcConnectionClient.createConnection = function () {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const createOptions = {
    beforeAnswer() {},

    stereo: false,
    ...options
  };
  const {
    host,
    beforeAnswer
  } = createOptions;
  let remotePeerConnectionId = undefined;
  let peerConnection = undefined;
  return axios.post("".concat(host, "/connections")).then(response => {
    const remotePeerConnection = response.data || {};
    remotePeerConnectionId = remotePeerConnection.id;
    peerConnection = WebRtcConnectionClient.createPeerConnection(host, remotePeerConnectionId);
    return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
  }).then(() => beforeAnswer(peerConnection)).then(() => peerConnection.createAnswer()).then(originalAnswer => peerConnection.setLocalDescription(new RTCSessionDescription({
    type: 'answer',
    sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
  }))).then(() => axios("".concat(host, "/connections/").concat(remotePeerConnectionId, "/remote-description"), {
    method: 'POST',
    data: JSON.stringify(peerConnection.localDescription),
    headers: {
      'Content-Type': 'application/json'
    }
  })).then(() => peerConnection).catch(error => {
    if (peerConnection) {
      peerConnection.close();
    }

    throw error;
  });
};