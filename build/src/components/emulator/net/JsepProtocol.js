"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _empty_pb = require("google-protobuf/google/protobuf/empty_pb");

var _url = _interopRequireDefault(require("url"));

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

var _SdpModifier = _interopRequireDefault(require("./SdpModifier"));

/**
 * This drives the jsep protocol with the emulator, and can be used to
 * send key/mouse/touch events to the emulator. Events will be send
 * over the data channel if open, otherwise they will be send via the
 * grpc endpoint.
 *
 * The jsep protocol is described here: https://rtcweb-wg.github.io/jsep/.
 */
class JsepProtocol {
  /**
   * Creates an instance of JsepProtocol.
   * @param {EmulatorControllerService} emulator Service used to make the gRPC calls
   * @param {RtcService} rtc Service used to open up the rtc calls.
   * @param {boolean} poll True if we should use polling
   * @param {string} edgeNodeId
   * @param {Logger} logger for console logs
   * @param {string|undefined} turnEndpoint Override the default uri for turn servers
   * @param {number|0} playoutDelayHint Custom playoutDelayHint value
   */
  constructor(emulator, rtc, poll, edgeNodeId, logger) {
    let turnEndpoint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
    let playoutDelayHint = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

    this.disconnect = () => {
      this.connected = false;
      this.streamConnectedTimestamp = undefined;

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection.removeEventListener('track', this._handlePeerConnectionTrack);
        this.peerConnection.removeEventListener('icecandidate', this._handlePeerIceCandidate);
        this.peerConnection.removeEventListener('connectionstatechange', this._handlePeerConnectionStateChange);
        this.peerConnection = null;
      }

      this.eventForwarders = {};

      if (this.stream) {
        this.stream.cancel();
        this.stream = null;
      }

      this.active = false;

      if (this.rtcEventTrigger) {
        this.logger.log('Unregister RTC event trigger:', this.rtcEventTrigger);
        clearInterval(this.rtcEventTrigger);
        this.rtcEventTrigger = null;
      }

      _StreamingEvent.default.edgeNode(this.edgeNodeId).off(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);

      _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.STREAM_DISCONNECTED);
    };

    this.startStream = () => {
      this.connected = false;
      this.peerConnection = null;
      this.active = true;
      const request = new _empty_pb.Empty();
      this.rtc.requestRtcStream(request, {}, (err, response) => {
        if (err) {
          this.logger.error('Failed to configure rtc stream: ' + JSON.stringify(err));
          this.disconnect();
          return;
        } // Configure


        this.guid = response;
        this.connected = true;

        if (!this.poll) {
          // Streaming envoy based.
          this.logger.info('Streaming JSEP messages.');

          this._streamJsepMessage();
        } else {
          // Poll pump messages, go/envoy based proxy.
          this.logger.info('Polling JSEP messages.');

          this._receiveJsepMessage();
        }
      });
    };

    this._handlePeerConnectionTrack = event => {
      if (this.streamConnectedTimestamp === undefined) {
        this.streamConnectedTimestamp = Date.now();
      }

      if (event.receiver) {
        // On supported devices, playoutDelayHint can be used to set a recommended latency of the playback
        // A low value will come with cost of higher frames dropped, a higher number wil decrease the number
        // of dropped frames, but will also add more delay.
        event.receiver.playoutDelayHint = this.playoutDelayHint / 1000;
        console.log("playoutDelayHint set to: ".concat(event.receiver.playoutDelayHint, "sec"));
      }

      _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.STREAM_CONNECTED, event.track);
    };

    this._handlePeerConnectionStateChange = () => {
      switch (this.peerConnection.connectionState) {
        case 'disconnected':
          // At least one of the ICE transports for the connection is in the "disconnected" state
          // and none of the other transports are in the state "failed", "connecting",
          // or "checking".
          this.disconnect();
          break;

        case 'failed':
          // One or more of the ICE transports on the connection is in the "failed" state.
          this.disconnect();
          break;

        case 'closed':
          //The RTCPeerConnection is closed.
          this.disconnect();
          break;

        case 'connected':
          {
            const senders = this.peerConnection.getSenders ? this.peerConnection.getSenders() : [];
            const iceTransport = ((senders[0] || {}).transport || {}).iceTransport || {};
            const candidatePair = iceTransport.getSelectedCandidatePair ? iceTransport.getSelectedCandidatePair() : {};
            const protocol = (candidatePair.local || {}).protocol || undefined;
            let connection = undefined;

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

            _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.PEER_CONNECTION_SELECTED, {
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

    this._handleDataChannelStatusChange = e => {
      this.logger.log('Data status change ' + e);
    };

    this._handlePeerIceCandidate = e => {
      if (e.candidate === null) return;

      this._sendJsep({
        candidate: e.candidate
      });
    };

    this._handleDataChannel = e => {
      let channel = e.channel;
      this.eventForwarders[channel.label] = channel;
    };

    this._handleStart = signal => {
      signal.start = {
        iceServers: [this.getIceConfiguration()],
        iceTransportPolicy: 'relay'
      };
      this.peerConnection = new RTCPeerConnection(signal.start);

      _StreamingEvent.default.edgeNode(this.edgeNodeId).on(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);

      this.peerConnection.addEventListener('track', this._handlePeerConnectionTrack, false);
      this.peerConnection.addEventListener('icecandidate', this._handlePeerIceCandidate, false);
      this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);

      this.peerConnection.ondatachannel = e => this._handleDataChannel(e);
    };

    this.onRequestWebRtcMeasurement = () => {
      this.peerConnection.getStats().then(stats => _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.WEB_RTC_MEASUREMENT, stats)).catch(err => _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.ERROR, err));
    };

    this._handleSDP = async signal => {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await this.peerConnection.createAnswer();
      const sdp = new _SdpModifier.default(answer.sdp); // This will set the target bandwidth usage to 1 mbits/sec for both video and audio stream.
      // The code is disable for now due to increased latency for everything above the default bandwidth.
      // sdp.setTargetBandwidth(1 * SDP.MEGABIT, 1 * SDP.MEGABIT);
      // This will force the system to only using one of the listed codecs for the video stream.
      // sdp.restrictVideoCodec(['VP9']);

      answer.sdp = sdp.toString();

      if (answer) {
        this.peerConnection.setLocalDescription(answer);

        this._sendJsep({
          sdp: answer
        });
      } else {
        this.disconnect();
      }
    };

    this._handleCandidate = signal => {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
    };

    this._handleJsepMessage = message => {
      try {
        const signal = JSON.parse(message);
        if (signal.start) this._handleStart(signal);
        if (signal.sdp) this._handleSDP(signal);
        if (signal.bye) this._handleBye();
        if (signal.candidate) this._handleCandidate(signal);
      } catch (e) {
        this.logger.error('Streaming View SDK: Failed to handle message: [' + message + '], due to: ' + JSON.stringify(e));
      }
    };

    this._handleBye = () => {
      if (this.connected) {
        this.disconnect();
      }
    };

    this._sendJsep = jsonObject => {
      /* eslint-disable */
      const request = new proto.android.emulation.control.JsepMsg();
      request.setId(this.guid);
      request.setMessage(JSON.stringify(jsonObject));
      this.rtc.sendJsepMessage(request);
    };

    this._streamJsepMessage = () => {
      if (!this.connected) return;
      const self = this;
      this.stream = this.rtc.receiveJsepMessages(this.guid, {});
      this.stream.on('data', response => {
        const msg = response.getMessage();

        self._handleJsepMessage(msg);
      });
      this.stream.on('error', e => {
        self.disconnect();
      });
      this.stream.on('end', e => {
        self.disconnect();
      });
    };

    this._receiveJsepMessage = () => {
      if (!this.connected) return;
      const self = this; // This is a blocking call, that will return as soon as a series
      // of messages have been made available, or if we reach a timeout

      this.rtc.receiveJsepMessage(this.guid, {}, (err, response) => {
        if (err) {
          this.logger.error('Failed to receive jsep message, disconnecting: ' + JSON.stringify(err));
          this.disconnect();
        }

        try {
          const msg = response.getMessage(); // Handle only if we received a useful message.
          // it is possible to get nothing if the server decides
          // to kick us out.

          if (msg) {
            self._handleJsepMessage(response.getMessage());
          }
        } catch (err) {
          this.logger.error('Failed to get jsep message, disconnecting: ' + JSON.stringify(err));
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
    this.logger = logger;
  }
  /**
   * Disconnects the stream. This will stop the message pump as well.
   */


  send(label, msg) {
    let bytes = msg.serializeBinary();
    let forwarder = this.eventForwarders[label]; // Send via data channel/gRPC bridge.

    if (this.connected && forwarder && forwarder.readyState === 'open') {
      this.eventForwarders[label].send(bytes);
    }
  }

  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  getIceConfiguration() {
    const hostname = _url.default.parse(this.emulator.hostname_).hostname;

    const endpoint = this.turnEndpoint ? this.turnEndpoint : "turn:".concat(hostname, ":3478");
    return {
      urls: ["".concat(endpoint, "?transport=udp"), "".concat(endpoint, "?transport=tcp")],
      username: 'webclient',
      credential: 'webclient'
    };
  }

}

exports.default = JsepProtocol;