import PropTypes from 'prop-types';
import React, { Component } from 'react';
import StreamingEvent from '../../../StreamingEvent';
import StreamCaptureService from '../../../service/StreamCaptureService';

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
    /** Volume of the video element, value between 0 and 1.  */
    volume: PropTypes.number,
    /** Audio is muted or enabled (un-muted) */
    muted: PropTypes.bool,
    /** The width of the screen/video feed provided by the emulator */
    emulatorWidth: PropTypes.number,
    /** The height of the screen/video feed provided by the emulator */
    emulatorHeight: PropTypes.number,
    emulatorVersion: PropTypes.string
  };

  state = {
    audio: false,
    video: false,
    playing: false
  };

  constructor(props) {
    super(props);
    this.video = React.createRef();
    this.canvas = React.createRef();
    this.isMountedInView = false;
    this.captureScreenMetaData = [];
    this.requireUserInteractionToPlay = false;
    this.streamCaptureService = new StreamCaptureService(this.props.edgeNodeId, this.video, this.canvas);
  }

  componentDidMount() {
    this.isMountedInView = true;
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .on(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .on(StreamingEvent.USER_INTERACTION, this.onUserInteraction);
    this.setState({ video: false, audio: false }, () => this.props.jsep.startStream());
    // Performing 'health-check' of the stream and reporting events when video is missing
    this.timer = setInterval(() => {
      if (this.requireUserInteractionToPlay) {
        return; // Do not reporting any StreamingEvent.STREAM_VIDEO_MISSING if the stream is waiting for user interaction in order to start the stream.
      }

      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
      } else {
        this.streamCaptureService.captureScreenshot(this.props.emulatorWidth, this.props.emulatorHeight);
      }
    }, 500);
  }

  componentWillUnmount() {
    this.isMountedInView = false;
    if (this.timer) {
      clearInterval(this.timer);
    }
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .off(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .off(StreamingEvent.USER_INTERACTION, this.onUserInteraction);
    this.props.jsep.disconnect();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.volume !== this.props.volume) {
      this.updateVideoVolumeProp();
    }

    if (prevProps.muted !== this.props.muted) {
      this.updateVideoMutedProp();
    }
  }

  /**
   * Update video muted property based on React property, when there is an update
   */
  updateVideoMutedProp() {
    if (this.isMountedInView && this.video.current && this.video.current.muted !== this.props.muted) {
      const streamIsPaused = this.video.current.paused;
      this.video.current.muted = this.props.muted;
      // If video was paused after unmuting, fire unmute error event, mute audio and play video
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
      if (streamIsPaused === false && streamIsPaused !== this.video.current.paused) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_UNMUTE_ERROR);
        // Play muted video, since browser may pause the video when un-muting action has failed
        this.video.current.muted = true;
        this.playVideo();
      }
    }
  }

  /**
   * Update video volume property based on React property, when there is an update
   * Note: iOS - Safari doesn't support volume attribute, so video can be only muted or un-muted (after user interaction)
   */
  updateVideoVolumeProp() {
    if (this.isMountedInView && this.video.current && this.video.current.volume !== this.props.volume) {
      this.video.current.volume = this.props.volume;
    }
  }

  playVideo = () => {
    const video = this.video.current;
    if (video && video.paused) {
      return (video.play() || Promise.reject(new Error('video.play() was not a promise')))
        .then(() => {
          this.requireUserInteractionToPlay = false;
        })
        .catch((error) => {
          this.props.logger.error(`Fail to start playing stream by user interaction due to ${error.name}`, error.message);
        });
    }

    this.requireUserInteractionToPlay = false;
    this.props.logger.info('Video stream was already playing');
  };

  onUserInteraction = () => {
    if (this.requireUserInteractionToPlay) {
      this.playVideo();
    }

    this.updateVideoMutedProp();
    this.updateVideoVolumeProp();

    if (this.isMountedInView && this.video.current && this.video.current.paused) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
    }
  };

  onDisconnect = () => {
    if (this.isMountedInView) {
      this.setState({ video: false, audio: false }, () => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_UNAVAILABLE);
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_UNAVAILABLE);
      });
    }
  };

  onConnect = (track) => {
    const video = this.video.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    if (!video.srcObject) {
      video.srcObject = new MediaStream();
    }

    video.srcObject.addTrack(track);
    if (track.kind === 'video') {
      this.setState({ video: true }, () => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_AVAILABLE);
      });
    }

    if (track.kind === 'audio') {
      this.setState({ audio: true }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_AVAILABLE));
    }
  };

  /**
   * Promise Timeout
   * @param {number} timeoutDuration
   * @returns {Promise<undefined>}
   */
  timeout = (timeoutDuration) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeoutDuration);
    });
  };

  onCanPlay = () => {
    const video = this.video.current;
    if (!video) {
      this.props.logger.error('Video DOM element not ready');
      return; // Component was unmounted.
    }

    const onUserInteractionCallback = () => {
      this.playVideo();
      this.updateVideoMutedProp();
      this.updateVideoVolumeProp();
    };

    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_CAN_PLAY);

    if (!this.requireUserInteractionToPlay) {
      if (video.paused) {
        return (video.play() || Promise.resolve('video.play() was not a promise'))
          .catch((error) => {
            if (error.name === 'NotAllowedError') {
              // The user agent (browser) or operating system doesn't allow playback of media in the current context or situation.
              // This may happen, if the browser requires the user to explicitly start media playback by clicking a "play" button.
              this.requireUserInteractionToPlay = true;
              StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.REQUIRE_USER_PLAY_INTERACTION, onUserInteractionCallback);
            } else {
              this.props.logger.error(`Fail to start playing stream due to ${error.name}`, error.message);
            }
          })
          .finally(() => {
            StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_READY, onUserInteractionCallback);
          });
      } else {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_READY, onUserInteractionCallback);
      }
      this.props.logger.info('Video stream was already playing');
    } else {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_READY, onUserInteractionCallback);
    }
  };

  onPlaying = () => {
    this.requireUserInteractionToPlay = false;
    this.setState({ playing: true });
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_PLAYING);

    this.props.jsep.peerConnection.getStats().then((stats) => {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') {
          const codec = (stats.get(report.codecId) || {}).mimeType;
          if (report.kind === 'audio' && codec) {
            StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_CODEC, codec.replace('audio/', ''));
          } else if (report.kind === 'video' && codec) {
            StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_CODEC, codec.replace('video/', ''));
          }
        }
      });
    });
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  render() {
    const { emulatorWidth, emulatorHeight } = this.props;
    const style = {
      margin: '0 auto',
      visibility: this.state.playing ? 'visible' : 'hidden',
      width: '100%',
      height: '100%'
    };

    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <video
          ref={this.video}
          style={style}
          // Initial muted value, un-muting is done dynamically through ref on userInteraction
          // Known issue: https://github.com/facebook/react/issues/10389
          muted={true}
          onContextMenu={this.onContextMenu}
          onCanPlay={this.onCanPlay}
          onPlaying={this.onPlaying}
          playsInline
        />
        <canvas
          style={{ display: 'none' }}
          ref={this.canvas}
          height={emulatorHeight / StreamCaptureService.CANVAS_SCALE_FACTOR}
          width={emulatorWidth / StreamCaptureService.CANVAS_SCALE_FACTOR}
        />
      </div>
    );
  }
}
