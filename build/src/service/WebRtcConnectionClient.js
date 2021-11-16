"use strict";

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) { symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; _forEachInstanceProperty(_context3 = ownKeys(Object(source), true)).call(_context3, function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context4; _forEachInstanceProperty(_context4 = ownKeys(Object(source))).call(_context4, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

var urlParse = require('url-parse');

var axios = require('axios')["default"];

var RTCPeerConnection = require('wrtc').RTCPeerConnection;

var _require = require('wrtc'),
    RTCSessionDescription = _require.RTCSessionDescription;
/**
 * WebRtcConnectionClient class to handle Web RTC client connections
 */


var WebRtcConnectionClient = function WebRtcConnectionClient() {
  (0, _classCallCheck2["default"])(this, WebRtcConnectionClient);
};

exports["default"] = WebRtcConnectionClient;

WebRtcConnectionClient.getIceConfiguration = function (host) {
  var hostname = urlParse(host).hostname;
  var endpoint = "turn:".concat(hostname, ":3478");
  return {
    urls: ["".concat(endpoint, "?transport=udp"), "".concat(endpoint, "?transport=tcp")],
    username: 'webclient',
    credential: 'webclient',
    ttl: 86400
  };
};

WebRtcConnectionClient.createPeerConnection = function (host, id) {
  var options = {
    sdpSemantics: 'unified-plan'
  };
  options.iceServers = [WebRtcConnectionClient.getIceConfiguration(host)];
  options.iceTransportPolicy = 'relay';
  var peerConnection = new RTCPeerConnection(options);

  var onConnectionStateChange = function onConnectionStateChange() {
    if (peerConnection.connectionState === 'disconnected') {
      var _context;

      axios["delete"]((0, _concat["default"])(_context = "".concat(host, "/connections/")).call(_context, id))["catch"](function (error) {
        console.log(error);
      });
      peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
    }
  };

  peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
  return peerConnection;
};

WebRtcConnectionClient.createConnection = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var createOptions = _objectSpread({
    beforeAnswer: function beforeAnswer() {},
    stereo: false
  }, options);

  var host = createOptions.host,
      beforeAnswer = createOptions.beforeAnswer;
  var remotePeerConnectionId = undefined;
  var peerConnection = undefined;
  return axios.post("".concat(host, "/connections")).then(function (response) {
    var remotePeerConnection = response.data || {};
    remotePeerConnectionId = remotePeerConnection.id;
    peerConnection = WebRtcConnectionClient.createPeerConnection(host, remotePeerConnectionId);
    return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
  }).then(function () {
    return beforeAnswer(peerConnection);
  }).then(function () {
    return peerConnection.createAnswer();
  }).then(function (originalAnswer) {
    return peerConnection.setLocalDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
    }));
  }).then(function () {
    var _context2;

    return axios((0, _concat["default"])(_context2 = "".concat(host, "/connections/")).call(_context2, remotePeerConnectionId, "/remote-description"), {
      method: 'POST',
      data: (0, _stringify["default"])(peerConnection.localDescription),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }).then(function () {
    return peerConnection;
  })["catch"](function (error) {
    if (peerConnection) {
      peerConnection.close();
    }

    throw error;
  });
};