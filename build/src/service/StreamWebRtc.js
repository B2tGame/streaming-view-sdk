"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _trunc = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/math/trunc"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _WebRtcConnectionClient = _interopRequireDefault(require("./WebRtcConnectionClient"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * StreamWebRtc is a WebRtc connection class to communicate with the backend
 */
var StreamWebRtc = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2.default)(StreamWebRtc, _EventEmitter);

  var _super = _createSuper(StreamWebRtc);

  /**
   * @param {string} host
   * @param {{name: string, candidates: []}} iceServers
   * @param {number} pingInterval
   * @param {boolean} measureWebrtcRtt
   */
  function StreamWebRtc(host) {
    var _this;

    var iceServers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      name: 'default',
      candidates: []
    };

    var _pingInterval = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : StreamWebRtc.WEBRTC_PING_INTERVAL;

    var measureWebrtcRtt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    (0, _classCallCheck2.default)(this, StreamWebRtc);
    _this = _super.call(this);

    _this.beforeAnswer = function (peerConnection) {
      var dataChannel = undefined;
      var interval = undefined;
      var sequenceId = 0;
      var pingInterval = _this.pingInterval;

      var onMessage = function onMessage(_ref) {
        var data = _ref.data;

        var _JSON$parse = JSON.parse(data),
            type = _JSON$parse.type,
            timestamp = _JSON$parse.timestamp;

        if (type === 'pong') {
          var sendTime = (0, _trunc.default)(timestamp);
          var rtt = Date.now() - sendTime;

          _this.emit(_StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, rtt);
        }
      };

      var onDataChannel = function onDataChannel(_ref2) {
        var channel = _ref2.channel;

        if (channel.label !== StreamWebRtc.DATA_CHANNEL_NAME) {
          return;
        }

        dataChannel = channel;
        dataChannel.addEventListener('message', onMessage);
        interval = setInterval(function () {
          if (dataChannel.readyState === 'open') {
            dataChannel.send((0, _stringify.default)({
              type: 'ping',
              timestamp: Date.now(),
              sequenceId: sequenceId++ // incremental counter to be able to detect out of order or lost packages

            }));
          }
        }, pingInterval);
      };

      var onConnectionStateChange = function onConnectionStateChange() {
        console.log('peerConnection.connectionState=', peerConnection.connectionState);

        switch (peerConnection.connectionState) {
          case 'disconnected':
            if (dataChannel) {
              dataChannel.removeEventListener('message', onMessage);
            }

            if (interval) {
              clearInterval(interval);
            }

            peerConnection.removeEventListener('connectionstatechange', onConnectionStateChange);
            break;

          case 'connected':
            _this.emit(_StreamingEvent.default.WEBRTC_CLIENT_CONNECTED);

            break;

          default:
        }
      };

      peerConnection.addEventListener('datachannel', onDataChannel);
      peerConnection.addEventListener('connectionstatechange', onConnectionStateChange);
    };

    _this.close = function () {
      if (_this.peerConnection) {
        _this.peerConnection.close();

        _this.peerConnection = null;
      }
    };

    _this.host = host;
    _this.iceServersName = iceServers.name;
    _this.iceServersCandidates = iceServers.candidates;
    _this.pingInterval = _pingInterval;
    _this.measureWebrtcRtt = measureWebrtcRtt;
    _this.peerConnection = undefined;

    _WebRtcConnectionClient.default.createConnection({
      beforeAnswer: _this.beforeAnswer,
      host: _this.host,
      iceServersName: _this.iceServersName,
      iceServersCandidates: _this.iceServersCandidates
    }).then(function (peerConnection) {
      _this.peerConnection = peerConnection;
    });

    return _this;
  }

  (0, _createClass2.default)(StreamWebRtc, null, [{
    key: "DATA_CHANNEL_NAME",
    get: function get() {
      return 'streaming-webrtc-server';
    }
    /**
     * Returns WebRtc ping interval number in ms.
     * @return {number}
     */

  }, {
    key: "WEBRTC_PING_INTERVAL",
    get: function get() {
      return 25;
    }
  }]);
  return StreamWebRtc;
}(_eventemitter.default);

exports.default = StreamWebRtc;

StreamWebRtc.calculateRoundTripTimeStats = function (values) {
  var stats = {
    rtt: 0,
    standardDeviation: 0
  };
  var n = values.length;

  if (n < 1) {
    return stats;
  }

  stats.rtt = (0, _reduce.default)(values).call(values, function (a, b) {
    return a + b;
  }, 0) / n;
  stats.standardDeviation = Math.sqrt((0, _reduce.default)(values).call(values, function (cum, item) {
    return cum + Math.pow(item - stats.rtt, 2);
  }, 0) / n);
  return stats;
};