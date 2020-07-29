/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EventEmitter } from 'events';
import '../../../android_emulation_control/emulator_controller_pb';
import MessageEmitter from '../../../service/MessageEmitter';

const qs = require('qs');

/**
 * This drives the jsep protocol with the emulator. The jsep protocol is described here:
 * https://rtcweb-wg.github.io/jsep/. Note that we use a message pump to the grpc endpoint
 * to receive jsep messages that must remain active for the duration of the connection.
 *
 *  This class can fire two events:
 *
 * - `connected` when the stream has become available.
 * - `disconnected` when the stream broke down, or when we failed to establish a connection
 *
 * You usually want to start the stream after instantiating this object. Do not forget to
 * disconnect once you are finished to terminate the message pump.
 *
 * @example
 *  jsep = new JsepProtocolDriver(emulator, s => { video.srcObject = s; video.play() });
 *  jsep.startStream();
 *
 * @export
 * @class JsepProtocol
 */
export default class JsepProtocol {
  /**
   * Creates an instance of JsepProtocol.
   * @param {EmulatorControllerService} emulator Service used to make the gRPC calls
   * @param {callback} onConnect optional callback that is invoked when a stream is available
   * @param {callback} onDisconnect optional callback that is invoked when the stream is closed.
   * @memberof JsepProtocol
   */
  constructor(emulator, onConnect, onDisconnect) {
    this.emulator = emulator;
    console.log('EMULATOR:', this.emulator);
    this.events = new EventEmitter();
    /* eslint-disable */
    this.guid = new proto.android.emulation.control.RtcId();
    this.event_forwarders = {};

    if (onConnect) this.events.on('connected', onConnect);
    if (onDisconnect) this.events.on('disconnected', onDisconnect);
  }

  on = (name, fn) => {
    this.events.on(name, fn);
  };

  /**
   * Disconnects the stream. This will stop the message pump as well.
   *
   * @memberof JsepProtocol
   */
  disconnect = () => {
    this.connected = false;
    if (this.peerConnection) this.peerConnection.close();
    this.active = false;
    this.events.emit('disconnected', this);
  };

  /**
   * Initiates the JSEP protocol.
   *
   * @memberof JsepProtocol
   */
  startStream = () => {
    const self = this;
    this.connected = false;
    this.peerConnection = null;
    this.active = true;

    var request = new proto.google.protobuf.Empty();
    this.emulator.requestRtcStream(request).on('data', (response) => {
      // Configure
      self.guid.setGuid(response.getGuid());
      self.connected = true;

      // And pump messages
      self._receiveJsepMessage();
    });
  };

  cleanup = () => {
    this.disconnect();
    if (this.peerConnection) {
      this.peerConnection.removeEventListener('track', this._handlePeerConnectionTrack);
      this.peerConnection.removeEventListener('icecandidate', this._handlePeerIceCandidate);
      this.peerConnection = null;
    }
  };

  _handlePeerConnectionTrack = (e) => {
    this.events.emit('connected', e.streams[0]);
  };

  _handlePeerConnectionStateChange = (e) => {
    switch (this.peerConnection.connectionState) {
      case 'disconnected':
      // At least one of the ICE transports for the connection is in the "disconnected" state
      // and none of the other transports are in the state "failed", "connecting",
      // or "checking".
      case 'failed':
      // One or more of the ICE transports on the connection is in the "failed" state.
      case 'closed':
        //The RTCPeerConnection is closed.
        this.disconnect();
    }
  };

  _handleDataChannelStatusChange = (e) => {
    console.log('Data status change ' + e);
  };

  send(label, msg) {
    let bytes = msg.serializeBinary();
    let forwarder = this.event_forwarders[label];

    // Send via data channel/gRPC bridge.
    if (forwarder && forwarder.readyState == 'open') {
      this.event_forwarders[label].send(bytes);
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
      }
    }
  }

  _handlePeerIceCandidate = (e) => {
    if (e.candidate === null) return;
    this._sendJsep({ candidate: e.candidate });
  };

  _handleDataChannel = (e) => {
    let channel = e.channel;
    this.event_forwarders[channel.label] = channel;
  };

  getIceConfiguration() {
    const jsonConfiguration = (qs.parse(window.location.search, { ignoreQueryPrefix: true }) || {}).ice || '';

    const configuration = jsonConfiguration ? JSON.parse(jsonConfiguration) : null;
    return configuration
      ? configuration
      : [
          {
            urls: [
              'turn:' + window.location.hostname + ':3478?transport=udp',
              'turn:' + window.location.hostname + ':3478?transport=tcp',
            ],
            username: 'webclient',
            credential: 'webclient',
          },
        ];
  }

  _handleStart = (signal) => {
    signal.start = {
      iceServers: this.getIceConfiguration(),
      iceTransportPolicy: 'relay',
    };

    this.peerConnection = new RTCPeerConnection(signal.start);
    this._startMonitor(this.peerConnection);

    this.peerConnection.addEventListener('track', this._handlePeerConnectionTrack, false);
    this.peerConnection.addEventListener('icecandidate', this._handlePeerIceCandidate, false);
    this.peerConnection.addEventListener('connectionstatechange', this._handlePeerConnectionStateChange, false);
    this.peerConnection.ondatachannel = (e) => {
      this._handleDataChannel(e);
    };
  };

  _startMonitor = (peerConnection) => {
    let prevTimestamp = 0;
    let prevBytesReceived = 0;
    let prevFramesDecoded = 0;
    let prevTotalDecodeTime = 0;

    setInterval(() => {
      peerConnection
        .getStats()
        .then((stats) => {
          // console.log(stats);
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const timeSinceLast = (Date.now() - prevTimestamp) / 1000.0;
              const framesPerSecond = (report.framesDecoded - prevFramesDecoded) / timeSinceLast;
              const bytePerSecond = (report.bytesReceived - prevBytesReceived) / timeSinceLast;
              const videoProcessing = ((report.totalDecodeTime || 0) - prevTotalDecodeTime) / framesPerSecond;

              if (prevTimestamp !== 0) {
                MessageEmitter.emit('WEB_RTC_STATS', {
                  measureAt: Date.now(),
                  measureDuration: timeSinceLast,
                  framesPerSecond: framesPerSecond,
                  bytePerSecond: bytePerSecond,
                  videoProcessing: report.totalDecodeTime ? videoProcessing : undefined,
                });
              }

              prevTimestamp = Date.now();
              prevBytesReceived = report.bytesReceived;
              prevFramesDecoded = report.framesDecoded;
              prevTotalDecodeTime = report.totalDecodeTime;
            }
          });
        })
        .catch((err) => {
          MessageEmitter.emit('WEB_RTC_STATS_ERROR', err);
        });
    }, 5000);
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
      console.log('Failed to handle message: [' + message + '], due to: ' + e);
    }
  };

  _handleBye = () => {
    if (this.connected) {
      this.disconnect();
    }
  };

  _sendJsep = (jsonObject) => {
    /* eslint-disable */
    var request = new proto.android.emulation.control.JsepMsg();
    request.setId(this.guid);
    request.setMessage(JSON.stringify(jsonObject));
    this.emulator.sendJsepMessage(request);
  };

  _receiveJsepMessage = () => {
    if (!this.connected) return;

    var self = this;

    // This is a blocking call, that will return as soon as a series
    // of messages have been made available, or if we reach a timeout
    this.emulator.receiveJsepMessage(this.guid, {}).on('data', (response) => {
      const msg = response.getMessage();
      // Handle only if we received a useful message.
      // it is possible to get nothing if the server decides
      // to kick us out.
      if (msg) {
        self._handleJsepMessage(response.getMessage());
      }

      // And pump messages. Note we must continue the message pump as we
      // can receive new ICE candidates at any point in time.
      if (self.active) {
        self._receiveJsepMessage();
      }
    });
  };
}
