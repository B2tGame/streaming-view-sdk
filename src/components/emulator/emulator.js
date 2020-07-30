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
import EmulatorWebrtcView from './views/webrtc_view.js';

/**
 * An emulator object that displays the screen and sends mouse events via gRPC.
 *
 * The emulator will mount a png, webrtc or fallback view component to display the current state
 * of the emulator. It will translate mouse events on this component and send them
 * to the actual emulator.
 *
 * The size of this component will be: (width * scale) x (height * scale)
 */
export default class Emulator extends Component {
  static propTypes = {
    emulator: PropTypes.object, // emulator service
    width: PropTypes.number,
    height: PropTypes.number,
    scale: PropTypes.number,
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
    turnHost: PropTypes.string,
  };

  static defaultProps = {
    width: 576, // The width of the emulator display
    height: 1024, // The height of the emulator display
    scale: 1, // Scale factor of the emulator image
  };

  render() {
    const { width, height, scale, emulator, enableControl, enableFullScreen, turnHost } = this.props;
    const styled = { outline: 'none', maxWidth: width * scale };

    return (
      <div tabIndex='1' style={styled}>
        <EmulatorWebrtcView
          width={width * scale}
          height={height * scale}
          emulator={emulator}
          enableControl={enableControl}
          enableFullScreen={enableFullScreen}
          turnHost={turnHost}
        />
      </div>
    );
  }
}
