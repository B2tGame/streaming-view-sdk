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

/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams.
 */
export default class EmulatorWebrtcView extends Component {
  static propTypes = {
    /** Jsep protocol driver, used to establish the video stream. */
    jsep: PropTypes.object,
    /** Function called when the connection state of the emulator changes */
    onStateChange: PropTypes.func,
    /** Function called when the audio track becomes available */
    onAudioStateChange: PropTypes.func,
    /** True if you wish to mute the audio */
    muted: PropTypes.bool,
    /** Volume of the video element, value between 0 and 1.  */
    volume: PropTypes.number,
    /** Function called when an error arises, like play failures due to muting */
    onError: PropTypes.func,
    /** The width of the emulator device */
    deviceWidth: PropTypes.number,
    /** The height of the emulator device */
    deviceHeight: PropTypes.number,
  };

  state = {
    audio: false,
  };

  static defaultProps = {
    muted: false,
    volume: 1.0,
    onError: (e) => console.error('WebRTC error: ' + e),
    onAudioStateChange: (e) => console.log('Webrtc audio became available: ' + e),
  };

  constructor(props) {
    super(props);

    this.video = React.createRef();
  }

  broadcastState() {
    const { onStateChange } = this.props;
    if (onStateChange) {
      onStateChange(this.state.connect);
    }
  }

  componentWillUnmount() {
    this.props.jsep.disconnect();
    this.setState();
  }

  componentDidMount() {
    this.props.jsep.on('connected', this.onConnect);
    this.props.jsep.on('disconnected', this.onDisconnect);
    this.setState({ connect: 'connecting' }, () => {
      this.props.jsep.startStream();
      this.broadcastState();
    });
  }

  onDisconnect = () => {
    this.setState({ connect: 'disconnected' }, this.broadcastState);
    this.setState({ audio: false }, () => {
      this.props.onAudioStateChange(false);
    });
  };

  onConnect = (track) => {
    this.setState({ connect: 'connected' }, this.broadcastState);
    const video = this.video.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    if (!video.srcObject) {
      video.srcObject = new MediaStream();
    }
    video.srcObject.addTrack(track);
    if (track.kind === 'audio') {
      this.setState({ audio: true }, () => {
        this.props.onAudioStateChange(true);
      });
    }
  };

  // Starts playing the video stream, muting it if no interaction has taken
  // place with this component.
  safePlay = () => {
    const video = this.video.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
    const possiblePromise = video.play();
    if (possiblePromise) {
      possiblePromise
        .then((_) => {
          console.info('Automatic playback started!');
        })
        .catch((error) => {
          // Notify listeners that we cannot start.
          this.props.onError(error);
        });
    }
  };

  onCanPlay = (e) => {
    this.safePlay();
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  render() {
    const { muted, volume, deviceWidth, deviceHeight } = this.props;
    /*
     * User Screen (Desktop eg. 16:9) - optimized for full-height
     * ┌─────────┬────────┬─────────┐
     * │         │        │         |
     * │ "BLACK" │ STREAM │ "BLACK" │
     * │         │        │         │
     * └─────────┴────────┴─────────┘
     *
     * User Screen (Phone eg. IPHONE X - 9:19.5) - optimized for full-width
     * ┌────────────┐
     * │   "BLACK"  │
     * ├────────────┤
     * │            │
     * │            │
     * │   STREAM   │
     * │            │
     * │            │
     * ├────────────┤
     * │   "BLACK"  │
     * └────────────┘
     */
    return (
      <video
        ref={this.video}
        // Optimize video size by comparing aspect ratios of the emulator device and browser window eg. (16/9 > 9/16)
        className={window.innerHeight / window.innerWidth > deviceHeight / deviceWidth ? 'full-width' : 'full-height'}
        style={{
          // display: "block",
          // position: "relative",
          margin: '0 auto',
          // objectFit: "contain",
          // objectPosition: "center",
        }}
        volume={volume}
        muted={muted}
        onContextMenu={this.onContextMenu}
        onCanPlay={this.onCanPlay}
        playsInline
      />
    );
  }
}
