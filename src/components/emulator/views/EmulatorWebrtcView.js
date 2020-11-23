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
import StreamingController from '../../../StreamingController';
import StreamingEvent from '../../../StreamingEvent';

/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams.
 */
export default class EmulatorWebrtcView extends Component {
  static propTypes = {
    /** gRPC Endpoint where we can reach the emulator. */
    uri: PropTypes.string.isRequired,
    /** Streaming Edge node ID */
    edgeNodeId: PropTypes.string.isRequired,
    /** Event Logger */
    logger: PropTypes.object.isRequired,
    /** Jsep protocol driver, used to establish the video stream. */
    jsep: PropTypes.object,
    /** True if you wish to mute the audio */
    muted: PropTypes.bool,
    /** Volume of the video element, value between 0 and 1.  */
    volume: PropTypes.number,
    /** The width of the emulator device */
    deviceWidth: PropTypes.number,
    /** The height of the emulator device */
    deviceHeight: PropTypes.number,
    emulatorWidth: PropTypes.number,
    emulatorHeight: PropTypes.number,
  };

  state = {
    audio: false,
  };

  static defaultProps = {
    muted: true,
    volume: 1.0,
  };

  constructor(props) {
    super(props);
    this.video = React.createRef();
  }

  componentWillUnmount() {
    StreamingEvent.edgeNode(this.props.edgeNodeId).off(StreamingEvent.STREAM_CONNECTED, this.onConnect);
    StreamingEvent.edgeNode(this.props.edgeNodeId).off(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect);
    this.props.jsep.disconnect();
    this.setState();
  }

  componentDidMount() {
    StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_CONNECTED, this.onConnect);
    StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect);
    this.setState({ connect: 'connecting' }, () => this.props.jsep.startStream());
  }

  componentDidUpdate() {
    this.video.current.volume = this.props.volume;
  }

  onDisconnect = () => {
    this.setState({ connect: 'disconnected' });
    this.setState({ audio: false }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_UNAVAILABLE));
  };

  onConnect = (track) => {
    this.setState({ connect: 'connected' });
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
      this.setState({ audio: true }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_AVAILABLE));
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
        .then(() => {
          // TODO Create a event when video is available
        })
        .catch(() => {
          // TODO Create a event when video is available
        });
    }
  };

  onCanPlay = () => {
    this.safePlay();
  };

  onPlaying = () => {
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_PLAYING);
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  render() {
    const { muted, emulatorWidth, emulatorHeight } = this.props;
    const style = {
      margin: '0 auto',
    };

    /*
     * Optimize video size by comparing aspect ratios of the emulator device and browser window eg. (16/9 > 9/16)
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
    if (window.innerHeight / window.innerWidth > emulatorHeight / emulatorWidth) {
      style.width = window.innerWidth + 'px';
    } else {
      style.height = window.innerHeight + 'px';
    }

    return (
      <video
        ref={this.video}
        style={style}
        muted={muted}
        onContextMenu={this.onContextMenu}
        onCanPlay={this.onCanPlay}
        onPlaying={this.onPlaying}
        playsInline
      />
    );
  }
}
