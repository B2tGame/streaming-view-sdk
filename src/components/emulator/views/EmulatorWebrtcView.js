import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
    /** Volume of the video element, value between 0 and 1.  */
    volume: PropTypes.number,
    /** The width of the emulator device */
    deviceWidth: PropTypes.number,
    /** The height of the emulator device */
    deviceHeight: PropTypes.number,
    emulatorWidth: PropTypes.number,
    emulatorHeight: PropTypes.number,
    emulatorVersion: PropTypes.string
  };

  static get CANVAS_SCALE_FACTOR() {
    return 10;
  }

  static get BLACK_SCREEN_DETECTOR_OFFSET() {
    return 5;
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
      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
      }
      this.captureScreen();
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

  componentDidUpdate() {
    this.video.current.volume = this.props.volume;
  }

  unmuteVideo() {
    // Some devices is automatic unmuting and do a unmute result in broken stream
    // Only change muted stated if required after giving the browser some time to act by it self.
    if (this.isMountedInView && this.video.current && this.video.current.muted) {
      setTimeout(() => {
        if (this.video.current.muted) {
          this.video.current.muted = false;
        }
      }, 250);
    }
  }

  /**
   * Capture the screen <video> element and check if the screen are a black (grey) screen or not.
   * @returns {string}
   */
  captureScreen = () => {
    const isBlackOrGrey = (r, g, b) => {
      return r < 50 && g < 50 && b < 50 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(b - r) < 25;
    };
    const getCauseOfBlackScreen = () => {
      if (!this.isMountedInView) {
        return 'Video element not in DOM tree';
      } else if (!this.state.video) {
        return 'Track has not been added to the video stream';
      } else if (this.video.current && this.video.current.paused || !this.state.playing) {
        return 'Video stream is paused';
      } else {
        return 'Unknown reason';
      }
    };

    if (this.canvas.current && this.video.current) {
      const ctx = this.canvas.current.getContext('2d');
      const { emulatorWidth, emulatorHeight } = this.props;
      ctx.drawImage(this.video.current, 0, 0, emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR, emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR);
      const rawImage = ctx.getImageData(0, 0, emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR, emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR);
      const selectedPixels = [
        isBlackOrGrey(
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4],
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + 1],
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + 2]
        ),
        isBlackOrGrey(
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4],
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + 1],
          rawImage.data[rawImage.width * EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + 2]
        ),
        isBlackOrGrey(
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4],
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + 1],
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET * 4 + 2]
        ),
        isBlackOrGrey(
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4],
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + 1],
          rawImage.data[rawImage.width * (rawImage.height - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + (rawImage.width - EmulatorWebrtcView.BLACK_SCREEN_DETECTOR_OFFSET) * 4 + 2]
        )
      ];

      const hasVideo = !selectedPixels.reduce((oldValue, newValue) => oldValue && newValue, true);
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.CAPTURE_SCREEN, {
        hasVideo: hasVideo,
        cause: hasVideo ? 'OK' : getCauseOfBlackScreen(),
        captureScreen: this.canvas.current.toDataURL('image/png')
      });
    } else {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.CAPTURE_SCREEN, {
        hasVideo: false,
        cause: 'DOM element not ready',
        captureScreen: undefined
      });
    }
  };


  onUserInteraction = () => {
    // Un-muting video stream on first user interaction, volume of video stream can be changed dynamically
    this.unmuteVideo();

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
      this.setState({ video: true }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_AVAILABLE));
    }

    if (track.kind === 'audio') {
      this.setState({ audio: true }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_AVAILABLE));
    }
  };

  onCanPlay = () => {
    const video = this.video.current;
    if (!video) {
      return; // Component was unmounted.
    }
    return (video.play() || Promise.resolve()).catch(() => {
    });
  };

  onPlaying = () => {
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
      visibility: this.state.playing ? 'visible' : 'hidden'
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
      <div>
        <video
          ref={this.video}
          style={style}
          muted={true} // Un-muting is done dynamically through ref on userInteraction
          onContextMenu={this.onContextMenu}
          onCanPlay={this.onCanPlay}
          onPlaying={this.onPlaying}
          playsInline
        />
        <canvas style={{ display: 'none' }} ref={this.canvas}
                height={emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR}
                width={emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR} />
      </div>
    );
  }
}
