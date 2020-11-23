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
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import EmulatorPngView from './views/EmulatorPngView.js';
import EmulatorWebrtcView from './views/EmulatorWebrtcView.js';
import EventHandler from './views/EventHandler';
import JsepProtocol from './net/JsepProtocol.js';
import * as Proto from '../../proto/emulator_controller_pb';
import { RtcService, EmulatorControllerService } from '../../proto/emulator_web_client';
import StreamingEvent from '../../StreamingEvent';


/**
 * A React component that displays a remote android emulator.
 *
 * The emulator will mount a png or webrtc view component to display the current state
 * of the emulator. It will translate mouse events on this component and send them
 * to the actual emulator.
 *
 * #### Authentication Service
 *
 * The authentication service should implement the following methods:
 *
 * - `authHeader()` which must return a set of headers that should be send along with a request.
 * - `unauthorized()` a function that gets called when a 401 was received.
 *
 * #### Type of view
 *
 * You usually want this to be webrtc as this will make use of the efficient
 * webrtc implementation. The png view will request screenshots, which are
 * very slow, and require the envoy proxy. You should not use this for remote emulators.
 *
 * Note that chrome will not autoplay the video if it is not muted and no interaction
 * with the page has taken place. See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes.
 *
 * #### Pressing hardware buttons
 *
 * This component has a method `sendKey` to sends a key to the emulator.
 * You can use this to send physical hardwar events to the emulator for example:
 *
 * "AudioVolumeDown" -  Decreases the audio volume.
 * "AudioVolumeUp"   -  Increases the audio volume.
 * "Power"           -  The Power button or key, turn off the device.
 * "AppSwitch"       -  Should bring up the application switcher dialog.
 * "GoHome"          -  Go to the home screen.
 * "GoBack"          -  Open the previous screen you were looking at.
 */

class Emulator extends Component {
  static propTypes = {
    /** gRPC Endpoint where we can reach the emulator. */
    uri: PropTypes.string.isRequired,
    /** Override the default uri for turn servers */
    turnEndpoint: PropTypes.string,
    /** Streaming Edge node ID */
    edgeNodeId: PropTypes.string.isRequired,
    /** The authentication service to use, or null for no authentication. */
    auth: PropTypes.object,
    /** True if the audio should be disabled. This is only relevant when using the webrtc engine. */
    muted: PropTypes.bool,
    /** Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100% */
    volume: PropTypes.number,
    /** The underlying view used to display the emulator, one of ["webrtc", "png"] */
    view: PropTypes.oneOf(['webrtc', 'png']),
    /** True if polling should be used, only set this to true if you are using the go webgrpc proxy. */
    poll: PropTypes.bool,
    /** True if the fullscreen should be enabled. */
    enableFullScreen: PropTypes.bool,
    /** Enable or disable user interactions with the game */
    enableControl: PropTypes.bool,
    /** Event Logger */
    logger: PropTypes.object.isRequired,
  };


  static defaultProps = {
    view: 'webrtc',
    auth: null,
    poll: false,
    muted: true,
    volume: 1.0,
    enableFullScreen: true,
    enableControl: true,
  };

  components = {
    webrtc: EmulatorWebrtcView,
    png: EmulatorPngView,
  };

  state = {
    lostConnection: false,
    width: undefined,
    height: undefined,
  };

  constructor(props) {
    super(props);
    const { uri, auth, poll } = props;
    this.emulator = new EmulatorControllerService(uri, auth, this.onError);
    this.rtc = new RtcService(uri, auth, this.onError);
    this.jsep = new JsepProtocol(
      this.emulator,
      this.rtc,
      poll,
      this.props.edgeNodeId,
      this.props.logger,
      this.props.turnEndpoint,
    );

    StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_DISCONNECTED, () => this.reConnect());

    StreamingEvent.edgeNode(this.props.edgeNodeId).once(StreamingEvent.EMULATOR_CONFIGURATION, (configuration) => {
      this.setState({
        width: configuration.emulatorWidth,
        height: configuration.emulatorHeight,
      });
    });
    this.view = React.createRef();
  }

  /**
   * Sends the given key to the emulator.
   *
   * You can use this to send physical hardware events to the emulator for example:
   *
   * "AudioVolumeDown" -  Decreases the audio volume.
   * "AudioVolumeUp"   -  Increases the audio volume.
   * "Power"           -  The Power button or key, turn off the device.
   * "AppSwitch"       -  Should bring up the application switcher dialog.
   * "GoHome"          -  Go to the home screen.
   * "GoBack"          -  Open the previous screen you were looking at.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values for
   * a list of valid values.
   */
  sendKey = (key) => {
    var request = new Proto.KeyboardEvent();
    request.setEventtype(Proto.KeyboardEvent.KeyEventType.KEYPRESS);
    request.setKey(key);
    this.jsep.send('keyboard', request);
  };

  reConnect() {
    this.setState({ lostConnection: true });
    setTimeout(() => {
      this.setState({ lostConnection: false });
    }, 500);
  }

  render() {
    const { view, poll, muted, volume, enableFullScreen, enableControl, uri } = this.props;

    return this.state.lostConnection ? null : (
      <EventHandler
        ref={this.view}
        emulatorWidth={this.state.width}
        emulatorHeight={this.state.height}
        uri={uri}
        emulator={this.emulator}
        jsep={this.jsep}
        poll={poll}
        muted={muted}
        volume={volume}
        onAudioStateChange={this.onAudioStateChange}
        enableFullScreen={enableFullScreen}
        enableControl={enableControl}
        logger={this.props.logger}
        edgeNodeId={this.props.edgeNodeId}
        view={this.components[view] || EmulatorWebrtcView}
      />
    );
  }
}

export default Emulator;
