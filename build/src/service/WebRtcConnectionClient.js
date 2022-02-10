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

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

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

WebRtcConnectionClient.createPeerConnection = function (host, iceServers, id) {
  var options = {
    sdpSemantics: 'unified-plan',
    iceServers: iceServers,
    iceTransportPolicy: 'relay'
  };
  console.log('RTCPeerConnection options:', options);
  var peerConnection = new _wrtc.RTCPeerConnection(options);

  var onConnectionStateChange = function onConnectionStateChange() {
    if (peerConnection.connectionState === 'disconnected') {
      var _context;

      _axios.default.delete((0, _concat.default)(_context = "".concat(host, "/connections/")).call(_context, id)).catch(function (error) {
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
      iceServersCandidates = createOptions.iceServersCandidates,
      beforeAnswer = createOptions.beforeAnswer;
  console.log('WebRtcConnectionClient.createConnection', {
    host: host,
    iceServersCandidates: iceServersCandidates
  });
  var remotePeerConnectionId = undefined;
  var peerConnection = undefined;

  var waitUntilIceGatheringStateComplete = function waitUntilIceGatheringStateComplete() {
    if (peerConnection.iceGatheringState === 'complete') {
      return;
    }

    var deferred = {};
    deferred.promise = new _promise.default(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    var onIceCandidate = function onIceCandidate(candidate) {
      if (candidate.candidate !== null && candidate.candidate !== undefined) {
        clearTimeout(timeout);
        peerConnection.removeEventListener('icecandidate', onIceCandidate);
        deferred.resolve(peerConnection);
      }
    };

    var timeout = setTimeout(function () {
      peerConnection.removeEventListener('icecandidate', onIceCandidate);
      deferred.reject(new Error('Timed out waiting for host candidates'));
    }, 3000);
    peerConnection.addEventListener('icecandidate', onIceCandidate);
    return deferred.promise;
  };

  console.log("axios POST to: ".concat(host, "/connections"));
  return _axios.default.post("".concat(host, "/connections")).then(function (response) {
    var remotePeerConnection = response.data || {};
    console.log("remotePeerConnection received form ".concat(host, "/connections"), remotePeerConnection);
    remotePeerConnectionId = remotePeerConnection.id;
    peerConnection = WebRtcConnectionClient.createPeerConnection(host, iceServersCandidates, remotePeerConnectionId);
    console.log("set remotePeerConnection.localDescription as remote description", remotePeerConnection.localDescription);
    return peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
  }).then(function () {
    console.log("setting peerConnection.setRemoteDescription DONE");
    console.log('peerConnection.connectionState:', peerConnection.connectionState);
    console.log('beforeAnswer; adding ping-pong event handlers');
    return beforeAnswer(peerConnection);
  }).then(function () {
    return peerConnection.createAnswer();
  }).then(function (originalAnswer) {
    console.log('peerConnection.createAnswer:', originalAnswer);
    console.log('peerConnection.setLocalDescription');
    return peerConnection.setLocalDescription(new _wrtc.RTCSessionDescription({
      type: 'answer',
      sdp: createOptions.stereo ? originalAnswer.sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111') : originalAnswer.sdp
    }));
  }).then(function () {
    return waitUntilIceGatheringStateComplete();
  }).then(function () {
    var _context2, _context3;

    console.log((0, _concat.default)(_context2 = "sending answer to: ".concat(host, "/connections/")).call(_context2, remotePeerConnectionId, "/remote-description with peerConnection.localDescription:"), peerConnection.localDescription);
    return (0, _axios.default)((0, _concat.default)(_context3 = "".concat(host, "/connections/")).call(_context3, remotePeerConnectionId, "/remote-description"), {
      method: 'POST',
      data: (0, _stringify.default)(peerConnection.localDescription),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }).then(function (response) {
    console.log('response from server:', response);
    return peerConnection;
  }).catch(function (error) {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    throw error;
  });
};