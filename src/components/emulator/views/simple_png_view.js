/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import * as Proto from '../../../proto/emulator_controller_pb';
import ResizeObserver from 'react-resize-observer';

/**
 * A view on the emulator that is generated by streaming a series of screenshots.
 *
 * Note: This is very expensive when running remote, and does not support audio.
 */
export default class EmulatorPngView extends Component {
  static propTypes = {
    /** Emulator service used to retrieve screenshots. */
    emulator: PropTypes.object,
    /** The width of the component */
    width: PropTypes.number,
    /** Function called when the state of the emulator changes,
     *
     * The state will be one of:
     *
     * - "connecting"
     * - "connected"
     * - "disconnected"
     *
     * The png view only supports streaming of images, and not audio.
     */
    onStateChange: PropTypes.func,
    /** True if polling should be used, only set this to true if you are using the gowebrpc proxy.
     * Note: Deprecated, setting this to true results in poor performance.
     */
    poll: PropTypes.bool,
    /** The width of the emulator device */
    deviceWidth: PropTypes.number,
    /** The height of the emulator device */
    deviceHeight: PropTypes.number,
  };

  state = {
    /** Currently displayed image, retrieved from the emulator. */
    png: '',
    width: null,
    height: null,
    connect: 'disconnected',
  };

  broadcastState() {
    const { onStateChange } = this.props;
    if (onStateChange) {
      onStateChange(this.state.connect);
    }
  }

  componentDidMount() {
    this.setState({ connect: 'connecting' }, this.broadcastState);
    this.startStream();
  }

  componentWillUnmount() {
    if (this.screen) {
      this.setState({ connect: 'disconnected' }, this.broadcastState);
      this.screen.cancel();
    }
  }

  startStream() {
    const { width, height } = this.state;
    if (this.screen) {
      this.screen.cancel();
    }

    var request = new Proto.ImageFormat();
    if (!isNaN(width)) {
      request.setWidth(Math.floor(width));
      request.setHeight(Math.floor(height));
    }

    var self = this;
    const { emulator, poll } = this.props;
    if (poll) {
      this.screen = emulator.getScreenshot(request);
    } else {
      this.screen = emulator.streamScreenshot(request);
    }
    this.screen.on('data', (response) => {
      this.setState({ connect: 'connected' }, this.broadcastState);
      // Update the image with the one we just received.
      self.setState({
        png: 'data:image/jpeg;base64,' + response.getImage_asB64(),
      });
      if (poll) {
        this.startStream(width, height);
      }
    });
  }

  render() {
    const { deviceWidth, deviceHeight } = this.props;
    const self = this;
    return (
      <div
        style={{
          display: 'block',
          position: 'relative',
          objectFit: 'contain',
          objectPosition: 'center',
          width: deviceWidth,
          height: deviceHeight,
        }}
      >
        <ResizeObserver
          onResize={(rect) => {
            self.setState({ width: rect.width, height: rect.height }, self.startStream);
          }}
        />
        <img src={this.state.png} width='100%' alt={'png-view'} />
      </div>
    );
  }
}
