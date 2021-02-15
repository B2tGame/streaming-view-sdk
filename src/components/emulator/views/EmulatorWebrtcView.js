import PropTypes from 'prop-types';
import React, { Component } from 'react';
import StreamingEvent from '../../../StreamingEvent';
import BlackScreenDetector from '../../../service/BlackScreenDetector';

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
    /** The width of the screen/video feed provided by the emulator */
    emulatorWidth: PropTypes.number,
    /** The height of the screen/video feed provided by the emulator */
    emulatorHeight: PropTypes.number,

    emulatorVersion: PropTypes.string
  };

  /**
   * How many times smaller should the thumbnail screenshot in comparison with the source stream.
   * @returns {number}
   * @constructor
   */
  static get CANVAS_SCALE_FACTOR() {
    return 12;
  }

  /**
   * How many pixels of the stream border should be used for calculation if the screen is black/gray.
   * The real pixel position is SCREEN_DETECTOR_OFFSET*CANVAS_SCALE_FACTOR of the origin size video stream.
   * @returns {number}
   */
  static get SCREEN_DETECTOR_OFFSET() {
    return 2;
  }

  state = {
    audio: false,
    video: false,
    playing: false
  };

  static defaultProps = {
    volume: 1.0
  };

  constructor(props) {
    super(props);
    this.video = React.createRef();
    this.canvas = React.createRef();
    this.isMountedInView = false;
    this.captureScreenMetaData = [];
    this.requireUserInteractionToPlay = false;
    this.blackScreenDetector = new BlackScreenDetector(
      this.props.edgeNodeId,
      this.video,
      this.canvas,
      this.props.emulatorWidth,
      this.props.emulatorHeight
    );
  }

  componentDidMount() {
    this.isMountedInView = true;
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .on(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .on(StreamingEvent.USER_INTERACTION, this.onUserInteraction)
      .once(StreamingEvent.STREAM_READY, this.onStreamReady);
    this.setState({ video: false, audio: false }, () => this.props.jsep.startStream());
    this.timer = setInterval(() => {
      if (this.requireUserInteractionToPlay) {
        return; // Do not reporting any StreamingEvent.STREAM_VIDEO_MISSING if the stream is waiting for user interaction in order to start the stream.
      }

      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
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
      .off(StreamingEvent.USER_INTERACTION, this.onUserInteraction)
      .off(StreamingEvent.STREAM_READY, this.onStreamReady);
    this.props.jsep.disconnect();
    this.blackScreenDetector.destroy();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.volume !== this.props.volume) {
      this.updateVideoVolume();
    }
  }

  /**
   * Update volume of the video and mute/un-mute if neccesary
   * Note: iOS - Safari doesn't support volume attribute, so video can be only muted or un-muted (after user interaction)
   */
  updateVideoVolume() {
    this.video.current.volume = this.props.volume;
    if (this.props.volume > 0 && this.video.current.muted) {
      this.unmuteVideo();
    } else if (this.props.volume === 0 && this.video.current.muted === false) {
      this.video.current.muted = true;
    }
  }

  unmuteVideo() {
    // Some devices is automatic unmuting and do a unmute result in broken stream
    // Only change muted stated if required after giving the browser some time to act by it self.
    if (this.isMountedInView && this.video.current && this.video.current.muted && this.props.volume > 0) {
      setTimeout(() => {
        if (this.isMountedInView && this.video.current && this.video.current.muted) {
          this.video.current.muted = false;
        }
      }, 250);
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

    // Un-muting video stream on first user interaction, volume of video stream can be changed dynamically
    this.unmuteVideo();
    if (this.isMountedInView && this.video.current && this.video.current.paused) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
    }
  };

  onStreamReady = () => {
    this.blackScreenDetector.startMonitoring();
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

    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_CAN_PLAY);
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_READY);

    if (!this.requireUserInteractionToPlay) {
      if (video.paused) {
        return (video.play() || Promise.resolve('video.play() was not a promise')).catch((error) => {
          if (error.name === 'NotAllowedError') {
            // The user agent (browser) or operating system doesn't allow playback of media in the current context or situation.
            // This may happen, if the browser requires the user to explicitly start media playback by clicking a "play" button.
            this.requireUserInteractionToPlay = true;

            StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.REQUIRE_USER_PLAY_INTERACTION, () => {
              this.playVideo();
            });
          } else {
            this.props.logger.error(`Fail to start playing stream due to ${error.name}`, error.message);
          }
        });
      }

      this.props.logger.info('Video stream was already playing');
    }
  };

  onPlaying = () => {
    this.requireUserInteractionToPlay = false;
    this.setState({ playing: true });
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_PLAYING);
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
          height={emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR}
          width={emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR}
        />
      </div>
    );
  }
}
