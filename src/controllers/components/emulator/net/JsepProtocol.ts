import { Empty } from 'google-protobuf/google/protobuf/empty_pb.js';
import * as StreamingEvent from '../../../StreamingEvent.js';
import defaults from '../../../../measurements/defaults.js';
import SdpModifier from './SdpModifier.js';
import { EmulatorControllerService, RtcService } from '../../../proto/emulator_web_client.js';
import { IceServerInfo } from '../../../service/IceServer.js';
import { Logger } from '../../../../measurements/Logger.js';
import { ClientReadableStream } from 'grpc-web';
import { JsepMsg, RtcId } from '../../../proto/rtc_service_pb.js';

type JSEPSignal = RTCSessionDescriptionInit & {
  start?: RTCConfiguration;
  bye?: any;
  candidate?: any;
};

/**
 * This drives the jsep protocol with the emulator, and can be used to
 * send key/mouse/touch events to the emulator. Events will be send
 * over the data channel if open, otherwise they will be send via the
 * grpc endpoint.
 *
 * The jsep protocol is described here: https://rtcweb-wg.github.io/jsep/.
 */
export default class JsepProtocol {
  guid: RtcId;
  eventForwarders: { [key: string]: RTCDataChannel } = {};
  connected = false;
  active = false;
  peerConnection?: RTCPeerConnection;
  streamConnectedTimestamp?: number;
  stream?: ClientReadableStream<JsepMsg>;

  /**
   * Creates an instance of JsepProtocol.
   * @param emulator Service used to make the gRPC calls
   * @param rtc Service used to open up the rtc calls.
   * @param poll True if we should use polling
   * @param edgeNodeId
   * @param logger for console logs
   * @param turnEndpoint Override the default uri for turn servers
   * @param playoutDelayHint Custom playoutDelayHint value
   * @param vp8MaxQuantization Max quantization for VP8, max value is 63
   * @param  preferH264 Whether to prefer H.264 encoding over VP8
   */
  constructor(
    public emulator: EmulatorControllerService,
    public rtc: RtcService,
    public poll: boolean,
    public edgeNodeId: string,
    public logger: Logger,
    public turnEndpoint?: string,
    public playoutDelayHint: number = 0,
    public iceServers: IceServerInfo = { name: 'default', candidates: [] },
    public vp8MaxQuantization?: number,
    public preferH264: boolean = defaults.preferH264
  ) {
    this.poll = poll || typeof this.rtc.receiveJsepMessages !== 'function';
  }

  /**
   * Disconnects the stream. This will stop the message pump as well.
   */
  disconnect = () => {
    this.connected = false;
    this.streamConnectedTimestamp = undefined;

    if (this.peerConnection) {
      this.peerConnection.removeEventListener('track', this._handlePeerConnectionTrack);
      this.peerConnection.removeEventListener('icecandidate', this._handlePeerIceCandidate);
      this.peerConnection.removeEventListener('connectionstatechange', this._handlePeerConnectionStateChange);
      this.peerConnection.close();
      this.peerConnection = undefined;
    }

    this.eventForwarders = {};

    if (this.stream) {
      this.stream.cancel();
      this.stream = undefined;
    }
    this.active = false;
    // if (this.rtcEventTrigger) {
    //   this.logger.info('Unregister RTC event trigger:', this.rtcEventTrigger);
    //   window.window.clearInterval(this.rtcEventTrigger);
    //   this.rtcEventTrigger = null;
    // }

    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_DISCONNECTED);
  };

  /**
   * Initiates the JSEP protocol.
   *
   */
  startStream = () => {
    this.connected = false;
    this.peerConnection = undefined;
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

  _handlePeerConnectionTrack = (event: RTCTrackEvent) => {
    if (this.streamConnectedTimestamp === undefined) {
      this.streamConnectedTimestamp = Date.now();
    }

    if (event.receiver) {
      // On supported devices, playoutDelayHint can be used to set a recommended latency of the playback
      // A low value will come with cost of higher frames dropped, a higher number wil decrease the number
      // of dropped frames, but will also add more delay.
      // @ts-ignore
      event.receiver.playoutDelayHint = this.playoutDelayHint / 1000;
    }
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_CONNECTED, event.track);
  };

  _handlePeerConnectionStateChange = () => {
    switch (this.peerConnection?.connectionState) {
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
      case 'connected': {
        const senders = this.peerConnection.getSenders ? this.peerConnection.getSenders() : [];
        // const iceTransport = ((senders[0] || {}).transport || {}).iceTransport || {};
        const iceTransport = senders[0]?.transport?.iceTransport;
        // @ts-ignore
        const candidatePair = iceTransport?.getSelectedCandidatePair ? iceTransport.getSelectedCandidatePair() : {};
        const protocol = candidatePair?.local?.protocol || undefined;
        let connection = undefined;
        switch (candidatePair?.local?.type) {
          case 'relay': {
            connection = 'relay';
            break;
          }
          case 'srflx': {
            connection = 'direct';
            break;
          }
          default: {
            // no action
          }
        }
        StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.PEER_CONNECTION_SELECTED, {
          connection: connection,
          protocol: protocol,
        });
        break;
      }
      default: {
        // no action
      }
    }
  };

  _handleDataChannelStatusChange = (e: string) => {
    this.logger.info('Data channel status change ' + e);
  };

  // How to handle JSEP messages?
  send(label: string, msg: any) {
    let bytes = msg.serializeBinary();
    let forwarder = this.eventForwarders[label];

    // Send via data channel/gRPC bridge.
    if (this.connected && forwarder && forwarder.readyState === 'open') {
      this.eventForwarders[label].send(bytes);
    }
  }

  _handlePeerIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate === null) return;
    this._sendJsep({ candidate: e.candidate });
  };

  _handleDataChannel = (e: RTCDataChannelEvent) => {
    let channel = e.channel;
    this.eventForwarders[channel.label] = channel;
  };

  /**
   * Get Ice configuration from emulator hostname
   * @returns {any|{urls: string[], credential: string, username: string}}
   */
  getIceConfiguration() {
    const url = new URL(this.emulator.hostname_);
    const hostname = url.hostname;
    const endpoint = this.turnEndpoint ? this.turnEndpoint : `turn:${hostname}:3478`;

    return {
      urls: [`${endpoint}?transport=udp`, `${endpoint}?transport=tcp`],
      username: 'webclient',
      credential: 'webclient',
    };
  }

  _handleStart = (signal: JSEPSignal) => {
    signal.start = {
      // @ts-ignore not yet supported in typescript
      sdpSemantics: 'unified-plan',
      //TODO-turn: use this.iceServers.candidates directly when the turn server related issues are fixed!
      //Replace iceServers in default turn case
      iceServers: this.iceServers.name === 'default' ? [this.getIceConfiguration()] : this.iceServers.candidates,
      iceTransportPolicy: 'relay',
    };
    this.logger.info(`JsepProtocol._handleStart; iceServers.name: ${this.iceServers.name}`, signal);

    this.peerConnection = new RTCPeerConnection(signal.start);

    this.peerConnection.addEventListener('track', this._handlePeerConnectionTrack, false);
    this.peerConnection.addEventListener('icecandidate', this._handlePeerIceCandidate, false);
    this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);
    this.peerConnection.ondatachannel = (e) => this._handleDataChannel(e);
  };

  peerConnectionInitialized() {
    return this.peerConnection !== null;
  }

  async getWebRtcStats() {
    const stats = await this.peerConnection?.getStats();
    let synchronizationSource = undefined;
    // Here we are assuming that we only receive one video track
    this.peerConnection?.getReceivers().forEach((r) => {
      if (r.track.kind === 'video') {
        r.getSynchronizationSources().forEach((s) => {
          synchronizationSource = s;
        });
      }
    });

    return { stats, synchronizationSource };
  }

  _handleSDP = async (signal: JSEPSignal) => {
    await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(signal));
    const answer = await this.peerConnection?.createAnswer();
    if (!answer?.sdp) {
      // How to handle this?
      this.logger.error('Failed to create answer');
      return;
    }
    const sdp = new SdpModifier(answer.sdp);
    // This will set the target bandwidth usage to 1 mbits/sec for both video and audio stream.
    // The code is disable for now due to increased latency for everything above the default bandwidth.
    // sdp.setTargetBandwidth(1 * SDP.MEGABIT, 1 * SDP.MEGABIT);

    // This will force the system to only using one of the listed codecs for the video stream.
    // sdp.restrictVideoCodec(['VP9']);

    // This allows a larger degradation in image quality than the default when we have a low bitrate,
    // which we prefer instead of decreasing FPS.
    if (this.vp8MaxQuantization !== undefined) {
      sdp.setVP8MaxQuantization(this.vp8MaxQuantization);
    }

    if (this.preferH264) {
      sdp.preferVideoCodec(['H264']);
    }

    answer.sdp = sdp.toString();

    if (answer) {
      this.peerConnection?.setLocalDescription(answer);
      this._sendJsep({ sdp: answer });
    } else {
      this.disconnect();
    }
  };

  _handleCandidate = (signal: JSEPSignal) => {
    this.peerConnection?.addIceCandidate(new RTCIceCandidate(signal));
  };

  _handleJsepMessage = (message: string) => {
    try {
      const signal = JSON.parse(message) as JSEPSignal;
      if (signal.start) this._handleStart(signal);
      if (signal.sdp) this._handleSDP(signal);
      if (signal.bye) this._handleBye();
      if (signal.candidate) this._handleCandidate(signal);
    } catch (e) {
      this.logger.error('Streaming View SDK: Failed to handle message: [' + message + '], due to: ' + JSON.stringify(e));
    }
  };

  _handleBye = () => {
    if (this.connected) {
      this.disconnect();
    }
  };

  _sendJsep = (jsonObject: object) => {
    // @ts-ignore Something is wrong with the typing I guess
    const request = new proto.android.emulation.control.JsepMsg();
    request.setId(this.guid);
    request.setMessage(JSON.stringify(jsonObject));
    // @ts-ignore Something is wrong with the typing I guess
    this.rtc.sendJsepMessage(request, null);
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
    this.stream.on('end', () => {
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
