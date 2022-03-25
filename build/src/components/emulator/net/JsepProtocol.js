"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _empty_pb = require("google-protobuf/google/protobuf/empty_pb");

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

var _urlParse = _interopRequireDefault(require("url-parse"));

var _SdpModifier = _interopRequireDefault(require("./SdpModifier"));

/**
 * This drives the jsep protocol with the emulator, and can be used to
 * send key/mouse/touch events to the emulator. Events will be send
 * over the data channel if open, otherwise they will be send via the
 * grpc endpoint.
 *
 * The jsep protocol is described here: https://rtcweb-wg.github.io/jsep/.
 */
var JsepProtocol = /*#__PURE__*/function () {
  /**
   * Creates an instance of JsepProtocol.
   * @param {EmulatorControllerService} emulator Service used to make the gRPC calls
   * @param {RtcService} rtc Service used to open up the rtc calls.
   * @param {boolean} poll True if we should use polling
   * @param {string} edgeNodeId
   * @param {Logger} logger for console logs
   * @param {string|undefined} turnEndpoint Override the default uri for turn servers
   * @param {number|0} playoutDelayHint Custom playoutDelayHint value
   * @param {number|undefined} vp8MaxQuantization Max quantization for VP8, max value is 63
   */
  function JsepProtocol(emulator, rtc, poll, edgeNodeId, logger) {
    var _this = this;

    var turnEndpoint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
    var playoutDelayHint = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var iceServers = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : [];
    var vp8MaxQuantization = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : undefined;
    (0, _classCallCheck2.default)(this, JsepProtocol);

    this.disconnect = function () {
      _this.connected = false;
      _this.streamConnectedTimestamp = undefined;

      if (_this.peerConnection) {
        _this.peerConnection.removeEventListener('track', _this._handlePeerConnectionTrack);

        _this.peerConnection.removeEventListener('icecandidate', _this._handlePeerIceCandidate);

        _this.peerConnection.removeEventListener('connectionstatechange', _this._handlePeerConnectionStateChange);

        _this.peerConnection.close();

        _this.peerConnection = null;
      }

      _this.eventForwarders = {};

      if (_this.stream) {
        _this.stream.cancel();

        _this.stream = null;
      }

      _this.active = false;

      if (_this.rtcEventTrigger) {
        _this.logger.log('Unregister RTC event trigger:', _this.rtcEventTrigger);

        clearInterval(_this.rtcEventTrigger);
        _this.rtcEventTrigger = null;
      }

      _StreamingEvent.default.edgeNode(_this.edgeNodeId).off(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, _this.onRequestWebRtcMeasurement);

      _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.STREAM_DISCONNECTED);
    };

    this.startStream = function () {
      _this.connected = false;
      _this.peerConnection = null;
      _this.active = true;
      var request = new _empty_pb.Empty();

      _this.rtc.requestRtcStream(request, {}, function (err, response) {
        if (err) {
          _this.logger.error('Failed to configure rtc stream: ' + (0, _stringify.default)(err));

          console.log('JsepProtocol.startStream: Failed to configure rtc stream:', (0, _stringify.default)(err));
          console.log('JsepProtocol.startStream: Disconnecting');

          _this.disconnect();

          return;
        } // Configure


        _this.guid = response;
        _this.connected = true;

        if (!_this.poll) {
          // Streaming envoy based.
          _this.logger.info('Streaming JSEP messages.');

          _this._streamJsepMessage();
        } else {
          // Poll pump messages, go/envoy based proxy.
          _this.logger.info('Polling JSEP messages.');

          _this._receiveJsepMessage();
        }
      });
    };

    this._handlePeerConnectionTrack = function (event) {
      if (_this.streamConnectedTimestamp === undefined) {
        _this.streamConnectedTimestamp = Date.now();
      }

      if (event.receiver) {
        // On supported devices, playoutDelayHint can be used to set a recommended latency of the playback
        // A low value will come with cost of higher frames dropped, a higher number wil decrease the number
        // of dropped frames, but will also add more delay.
        event.receiver.playoutDelayHint = _this.playoutDelayHint / 1000;
        console.log("playoutDelayHint set to: ".concat(event.receiver.playoutDelayHint, "sec"));
      }

      _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.STREAM_CONNECTED, event.track);
    };

    this._handlePeerConnectionStateChange = function () {
      console.log('JsepProtocol._handlePeerConnectionStateChange:', {
        connectionState: _this.peerConnection.connectionState
      });

      switch (_this.peerConnection.connectionState) {
        case 'disconnected':
          // At least one of the ICE transports for the connection is in the "disconnected" state
          // and none of the other transports are in the state "failed", "connecting",
          // or "checking".
          _this.disconnect();

          break;

        case 'failed':
          // One or more of the ICE transports on the connection is in the "failed" state.
          _this.disconnect();

          break;

        case 'closed':
          //The RTCPeerConnection is closed.
          _this.disconnect();

          break;

        case 'connected':
          {
            var senders = _this.peerConnection.getSenders ? _this.peerConnection.getSenders() : [];
            var iceTransport = ((senders[0] || {}).transport || {}).iceTransport || {};
            var candidatePair = iceTransport.getSelectedCandidatePair ? iceTransport.getSelectedCandidatePair() : {};
            var protocol = (candidatePair.local || {}).protocol || undefined;
            var connection = undefined;

            switch ((candidatePair.local || {}).type) {
              case 'relay':
                {
                  connection = 'relay';
                  break;
                }

              case 'srflx':
                {
                  connection = 'direct';
                  break;
                }

              default:
                {// no action
                }
            }

            _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.PEER_CONNECTION_SELECTED, {
              connection: connection,
              protocol: protocol
            });

            break;
          }

        default:
          {// no action
          }
      }
    };

    this._handlePeerOnIceCandidateError = function (e) {
      console.log('JsepProtocol._handlePeerOnIceCandidateError:', e);
    };

    this._handleDataChannelStatusChange = function (e) {
      console.log('JsepProtocol._handleDataChannelStatusChange:', e);

      _this.logger.log('Data status change ' + e);
    };

    this._handlePeerIceCandidate = function (e) {
      console.log('JsepProtocol._handlePeerIceCandidate:', {
        candidate: e.candidate
      });
      if (e.candidate === null) return;

      _this._sendJsep({
        candidate: e.candidate
      });
    };

    this._handleDataChannel = function (e) {
      var channel = e.channel;
      _this.eventForwarders[channel.label] = channel;
    };

    this._handleStart = function (signal) {
      signal.start = {
        sdpSemantics: 'unified-plan',
        iceServers: !_this.iceServers.length ? [_this.getIceConfiguration()] : _this.iceServers,
        iceTransportPolicy: 'relay'
      };
      console.log('JsepProtocol._handleStart:', signal);
      _this.peerConnection = new RTCPeerConnection(signal.start);

      _StreamingEvent.default.edgeNode(_this.edgeNodeId).on(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, _this.onRequestWebRtcMeasurement);

      _this.peerConnection.addEventListener('track', _this._handlePeerConnectionTrack, false);

      _this.peerConnection.addEventListener('icecandidate', _this._handlePeerIceCandidate, false);

      _this.peerConnection.addEventListener('connectionstatechange', _this._handlePeerConnectionStateChange, false);

      _this.peerConnection.addEventListener('onicecandidateerror', _this._handlePeerOnIceCandidateError, false);

      _this.peerConnection.ondatachannel = function (e) {
        return _this._handleDataChannel(e);
      };
    };

    this.onRequestWebRtcMeasurement = function () {
      _this.peerConnection.getStats().then(function (stats) {
        return _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.WEB_RTC_MEASUREMENT, stats);
      }).catch(function (err) {
        return _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.ERROR, err);
      });
    };

    this._handleSDP = /*#__PURE__*/function () {
      var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(signal) {
        var answer, sdp;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));

              case 2:
                _context.next = 4;
                return _this.peerConnection.createAnswer();

              case 4:
                answer = _context.sent;
                sdp = new _SdpModifier.default(answer.sdp); // This will set the target bandwidth usage to 1 mbits/sec for both video and audio stream.
                // The code is disable for now due to increased latency for everything above the default bandwidth.
                // sdp.setTargetBandwidth(1 * SDP.MEGABIT, 1 * SDP.MEGABIT);
                // This will force the system to only using one of the listed codecs for the video stream.
                // sdp.restrictVideoCodec(['VP9']);
                // This allows a larger degradation in image quality than the default when we have a low bitrate,
                // which we prefer instead of decreasing FPS.

                if (_this.vp8MaxQuantization !== undefined) {
                  sdp.setVP8MaxQuantization(_this.vp8MaxQuantization);
                }

                answer.sdp = sdp.toString();
                console.log('JsepProtocol._handleSDP:', answer);

                if (answer) {
                  _this.peerConnection.setLocalDescription(answer);

                  _this._sendJsep({
                    sdp: answer
                  });
                } else {
                  _this.disconnect();
                }

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();

    this._handleCandidate = function (signal) {
      _this.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
    };

    this._handleJsepMessage = function (message) {
      console.log('JsepProtocol._handleJsepMessage:', message);

      try {
        var signal = JSON.parse(message);
        if (signal.start) _this._handleStart(signal);
        if (signal.sdp) _this._handleSDP(signal);
        if (signal.bye) _this._handleBye();
        if (signal.candidate) _this._handleCandidate(signal);
      } catch (e) {
        _this.logger.error('Streaming View SDK: Failed to handle message: [' + message + '], due to: ' + (0, _stringify.default)(e));
      }
    };

    this._handleBye = function () {
      if (_this.connected) {
        console.log('JsepProtocol._handleBye: Disconnecting');

        _this.disconnect();
      }
    };

    this._sendJsep = function (jsonObject) {
      /* eslint-disable */
      var request = new proto.android.emulation.control.JsepMsg();
      request.setId(_this.guid);
      request.setMessage((0, _stringify.default)(jsonObject));
      console.log('JsepProtocol._sendJsep:', request);

      _this.rtc.sendJsepMessage(request);
    };

    this._streamJsepMessage = function () {
      if (!_this.connected) return;
      var self = _this;
      _this.stream = _this.rtc.receiveJsepMessages(_this.guid, {});

      _this.stream.on('data', function (response) {
        var msg = response.getMessage();

        self._handleJsepMessage(msg);
      });

      _this.stream.on('error', function (e) {
        self.disconnect();
      });

      _this.stream.on('end', function (e) {
        self.disconnect();
      });
    };

    this._receiveJsepMessage = function () {
      if (!_this.connected) return;
      var self = _this; // This is a blocking call, that will return as soon as a series
      // of messages have been made available, or if we reach a timeout

      _this.rtc.receiveJsepMessage(_this.guid, {}, function (err, response) {
        if (err) {
          _this.logger.error('Failed to receive jsep message, disconnecting: ' + (0, _stringify.default)(err));

          _this.disconnect();
        }

        try {
          var msg = response.getMessage(); // Handle only if we received a useful message.
          // it is possible to get nothing if the server decides
          // to kick us out.

          if (msg) {
            self._handleJsepMessage(response.getMessage());
          }
        } catch (err) {
          _this.logger.error('Failed to get jsep message, disconnecting: ' + (0, _stringify.default)(err));
        } // And pump messages. Note we must continue the message pump as we
        // can receive new ICE candidates at any point in time.


        if (self.active) {
          self._receiveJsepMessage();
        }
      });
    };

    this.emulator = emulator;
    this.rtc = rtc;
    this.guid = null;
    this.edgeNodeId = edgeNodeId;
    this.stream = null;
    this.turnEndpoint = turnEndpoint;
    this.eventForwarders = {};
    this.poll = poll || typeof this.rtc.receiveJsepMessages !== 'function';
    this.playoutDelayHint = playoutDelayHint;
    this.iceServers = iceServers;
    this.vp8MaxQuantization = vp8MaxQuantization;
    this.logger = logger;
  }
  /**
   * Disconnects the stream. This will stop the message pump as well.
   */


  (0, _createClass2.default)(JsepProtocol, [{
    key: "send",
    value: function send(label, msg) {
      var bytes = msg.serializeBinary();
      var forwarder = this.eventForwarders[label]; // Send via data channel/gRPC bridge.

      if (this.connected && forwarder && forwarder.readyState === 'open') {
        this.eventForwarders[label].send(bytes);
      }
    }
  }, {
    key: "getIceConfiguration",
    value:
    /**
     * Get Ice configuration from emulator hostname
     * @returns {any|{urls: string[], credential: string, username: string}}
     */
    function getIceConfiguration() {
      var hostname = (0, _urlParse.default)(this.emulator.hostname_).hostname;
      var endpoint = this.turnEndpoint ? this.turnEndpoint : "turn:".concat(hostname, ":3478");
      return {
        urls: ["".concat(endpoint, "?transport=udp"), "".concat(endpoint, "?transport=tcp")],
        username: 'webclient',
        credential: 'webclient'
      };
    }
  }]);
  return JsepProtocol;
}();

exports.default = JsepProtocol;