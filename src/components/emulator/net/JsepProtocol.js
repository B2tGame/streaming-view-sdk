import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import url from 'url';
import StreamingEvent from '../../../StreamingEvent';

/**
 * This drives the jsep protocol with the emulator, and can be used to
 * send key/mouse/touch events to the emulator. Events will be send
 * over the data channel if open, otherwise they will be send via the
 * grpc endpoint.
 *
 * The jsep protocol is described here: https://rtcweb-wg.github.io/jsep/.
 */
export default class JsepProtocol {
  /**
   * Creates an instance of JsepProtocol.
   * @param {EmulatorControllerService} emulator Service used to make the gRPC calls
   * @param {RtcService} rtc Service used to open up the rtc calls.
   * @param {boolean} poll True if we should use polling
   * @param {string} edgeNodeId
   * @param {Logger} logger for console logs
   * @param {string|undefined} turnEndpoint Override the default uri for turn servers
   */
  constructor(emulator, rtc, poll, edgeNodeId, logger, turnEndpoint = undefined) {
    this.emulator = emulator;
    this.rtc = rtc;
    this.guid = null;
    this.edgeNodeId = edgeNodeId;
    this.stream = null;
    this.turnEndpoint = turnEndpoint;
    this.eventForwarders = {};
    this.poll = poll || typeof this.rtc.receiveJsepMessages !== 'function';
    this.logger = logger;
  }

  /**
   * Disconnects the stream. This will stop the message pump as well.
   */
  disconnect = () => {
    this.connected = false;
    if (this.peerConnection) {
      this.peerConnection.close();
    }
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
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_DISCONNECTED);
  };

  /**
   * Initiates the JSEP protocol.
   *
   */
  startStream = () => {
    this.connected = false;
    this.peerConnection = null;
    this.active = true;

    const request = new Empty();
    this.rtc.requestRtcStream(request, {}, (err, response) => {
      if (err) {
        this.logger.error('Failed to configure rtc stream: ' + JSON.stringify(err));
        this.disconnect();
        return;
      }
      // Configure
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

  cleanup = () => {
    this.disconnect();
    StreamingEvent.edgeNode(this.edgeNodeId).off(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);
    if (this.peerConnection) {
      this.peerConnection.removeEventListener('track', this._handlePeerConnectionTrack);
      this.peerConnection.removeEventListener('icecandidate', this._handlePeerIceCandidate);
      this.peerConnection.removeEventListener('connectionstatechange', this._handlePeerConnectionStateChange);

      this.peerConnection = null;
    }
    this.eventForwarders = {};
  };

  _handlePeerConnectionTrack = (event) => {
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_CONNECTED, event.track);
  };

  _handlePeerConnectionStateChange = () => {
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
      default:
    }
  };

  _handleDataChannelStatusChange = (e) => {
    this.logger.log('Data status change ' + e);
  };


  send(label, msg) {
    let bytes = msg.serializeBinary();
    let forwarder = this.eventForwarders[label];
    // Send via data channel/gRPC bridge.
    if (this.connected && forwarder && forwarder.readyState === 'open') {
      this.eventForwarders[label].send(bytes);
    } else {
      // Fallback to using the gRPC protocol
      switch (label) {
        case 'mouse':
          this.emulator.sendMouse(msg);
          break;
        case 'keyboard':
          this.emulator.sendKey(msg);
          break;
        case 'touch':
          this.emulator.sendTouch(msg);
          break;
        default:
      }
    }
  }

  _handlePeerIceCandidate = (e) => {
    if (e.candidate === null) return;
    this._sendJsep({ candidate: e.candidate });
  };

  _handleDataChannel = (e) => {
    let channel = e.channel;
    this.eventForwarders[channel.label] = channel;
  };

  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  getIceConfiguration() {
    const hostname = url.parse(this.emulator.hostname_).hostname;
    const endpoint = this.turnEndpoint ? this.turnEndpoint : `turn:${hostname}:3478`;

    return {
      urls: [`${endpoint}?transport=udp`, `${endpoint}?transport=tcp`],
      username: 'webclient',
      credential: 'webclient'
    };
  }

  _handleStart = (signal) => {
    // Emulator passing configuration via start signal
    const parsedResolution = signal.start.iceServers.configuration.resolution.split('x');
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.EMULATOR_CONFIGURATION, {
      emulatorWidth: parseInt(parsedResolution[0]),
      emulatorHeight: parseInt(parsedResolution[1])
    });

    signal.start = {
      iceServers: [this.getIceConfiguration()],
      iceTransportPolicy: 'relay'
    };
    this.peerConnection = new RTCPeerConnection(signal.start);

    StreamingEvent.edgeNode(this.edgeNodeId).on(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);

    this.peerConnection.addEventListener('track', this._handlePeerConnectionTrack, false);
    this.peerConnection.addEventListener('icecandidate', this._handlePeerIceCandidate, false);
    this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);
    this.peerConnection.ondatachannel = (e) => this._handleDataChannel(e);
  };

  onRequestWebRtcMeasurement = () => {
    if (this.peerConnection) {
      this.peerConnection
        .getStats()
        .then((stats) => StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.WEB_RTC_MEASUREMENT, stats))
        .catch((err) => StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.ERROR, err));
    }
  };


  _handleSDP = async (signal) => {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    const answer = await this.peerConnection.createAnswer();
    if (answer) {
      this.peerConnection.setLocalDescription(answer);
      this._sendJsep({ sdp: answer });
    } else {
      this.disconnect();
    }
  };

  _handleCandidate = (signal) => {
    this.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
  };

  _handleJsepMessage = (message) => {
    try {
      const signal = JSON.parse(message);
      if (signal.start) this._handleStart(signal);
      if (signal.sdp) this._handleSDP(signal);
      if (signal.bye) this._handleBye();
      if (signal.candidate) this._handleCandidate(signal);
    } catch (e) {
      this.logger.error(
        'Streaming View SDK: Failed to handle message: [' + message + '], due to: ' + JSON.stringify(e)
      );
    }
  };

  _handleBye = () => {
    if (this.connected) {
      this.disconnect();
    }
  };

  _sendJsep = (jsonObject) => {
    /* eslint-disable */
    const request = new proto.android.emulation.control.JsepMsg();
    request.setId(this.guid);
    request.setMessage(JSON.stringify(jsonObject));
    this.rtc.sendJsepMessage(request);
  };

  _streamJsepMessage = () => {
    if (!this.connected) return;
    const self = this;

    this.stream = this.rtc.receiveJsepMessages(this.guid, {});
    this.stream.on('data', (response) => {
      const msg = response.getMessage();
      self._handleJsepMessage(msg);
    });
    this.stream.on('error', (e) => {
      self.disconnect();
    });
    this.stream.on('end', (e) => {
      self.disconnect();
    });
  };

  // This function is a fallback for v1 (go based proxy), that does not support streaming.
  _receiveJsepMessage = () => {
    if (!this.connected) return;
    const self = this;
    // This is a blocking call, that will return as soon as a series
    // of messages have been made available, or if we reach a timeout
    this.rtc.receiveJsepMessage(this.guid, {}, (err, response) => {
      if (err) {
        this.logger.error('Failed to receive jsep message, disconnecting: ' + JSON.stringify(err));
        this.disconnect();
      }

      try {
        const msg = response.getMessage();
        // Handle only if we received a useful message.
        // it is possible to get nothing if the server decides
        // to kick us out.
        if (msg) {
          self._handleJsepMessage(response.getMessage());
        }
      } catch (err) {
        this.logger.error('Failed to get jsep message, disconnecting: ' + JSON.stringify(err));
      }

      // And pump messages. Note we must continue the message pump as we
      // can receive new ICE candidates at any point in time.
      if (self.active) {
        self._receiveJsepMessage();
      }
    });
  };
}
