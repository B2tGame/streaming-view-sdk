"use strict";

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _urlParse = _interopRequireDefault(require("url-parse"));

var _axios = _interopRequireDefault(require("axios"));

var _wrtc = require("wrtc");

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */
var WebRtcConnectionClient = /*#__PURE__*/(0, _createClass2.default)(function WebRtcConnectionClient() {
  (0, _classCallCheck2.default)(this, WebRtcConnectionClient);
});
exports.default = WebRtcConnectionClient;

WebRtcConnectionClient.getIceConfiguration = function (host) {
  var hostname = (0, _urlParse.default)(host).hostname;
  var endpoint = "turn:".concat(hostname, ":3478");
  return {
    urls: ["".concat(endpoint, "?transport=udp"), "".concat(endpoint, "?transport=tcp")],
    username: 'webclient',
    credential: 'webclient',
    ttl: 86400
  };
};

WebRtcConnectionClient.createPeerConnection = function (host, iceServers, id) {
  var peerConnection = new _wrtc.RTCPeerConnection({
    sdpSemantics: 'unified-plan',
    iceServers: iceServers.length ? iceServers : [WebRtcConnectionClient.getIceConfiguration(host)],
    iceTransportPolicy: 'relay'
  });

  var onIceCandidateError = function onIceCandidateError(event) {
    console.log('onIceCandidateError was called with event:', event); // if (event.errorCode >= 300 && event.errorCode <= 699) {
    //   // STUN errors are in the range 300-699. See RFC 5389, section 15.6
    //   // for a list of codes. TURN adds a few more error codes; see
    //   // RFC 5766, section 15 for details.
    // } else if (event.errorCode >= 700 && event.errorCode <= 799) {
    //   // Server could not be reached; a specific error number is
    //   // provided but these are not yet specified.
    // }
  };

  var onConnectionStateChange = function onConnectionStateChange() {
    // console.log('peerConnection.connectionState=', peerConnection.connectionState);
    if (peerConnection.connectionState === 'disconnected') {
      var _context;

      _axios.default.delete((0, _concat.default)(_context = "".concat(host, "/connections/")).call(_context, id)).catch(function (error) {
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

WebRtcConnectionClient.createConnection = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var createOptions = _objectSpread({
    beforeAnswer: function beforeAnswer() {},
    stereo: false
  }, options);

  var host = createOptions.host,
      iceServersCandidates = createOptions.iceServersCandidates,
      beforeAnswer = createOptions.beforeAnswer;
  var remotePeerConnectionId = undefined;
  var peerConnection = undefined;
  return _axios.default.post("".concat(host, "/connections")).then(function (response) {
    var remotePeerConnection = response.data || {};
    remotePeerConnectionId = remotePeerConnection.id;
    peerConnection = WebRtcConnectionClient.createPeerConnection(host, iceServersCandidates, remotePeerConnectionId);
    return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
  }).then(function () {
    return beforeAnswer(peerConnection);
  }).then(function () {
    return peerConnection.createAnswer();
  }).then(function (originalAnswer) {
    return peerConnection.setLocalDescription(new _wrtc.RTCSessionDescription({
      type: 'answer',
      sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
    }));
  }).then(function () {
    var _context2;

    return (0, _axios.default)((0, _concat.default)(_context2 = "".concat(host, "/connections/")).call(_context2, remotePeerConnectionId, "/remote-description"), {
      method: 'POST',
      data: (0, _stringify.default)(peerConnection.localDescription),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }).then(function () {
    return peerConnection;
  }).catch(function (error) {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    throw error;
  });
};