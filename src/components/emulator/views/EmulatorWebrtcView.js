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

  /**
   * How many times smaller should the thumbnail screenshot be compare with the source stream.
   * @returns {number}
   * @constructor
   */
  static get CANVAS_SCALE_FACTOR() {
    return 12;
  }

  /**
   * How many pixels in of the border of the screen should be used for calculate if the screen is black/gray or not.
   * The real pixel position is SCREEN_DETECTOR_OFFSET*CANVAS_SCALE_FACTOR of the origin size video stream.
   * @returns {number}
   */
  static get SCREEN_DETECTOR_OFFSET() {
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
    /**
     * Test if a color is dark grey (including total black)
     * @param {{red: number, green: number, blue: number}} pixel
     * @returns {boolean}
     */
    const isDarkGrey = (pixel) => {
      return pixel.red < 50 && pixel.green < 50 && pixel.blue < 50 && Math.abs(pixel.red - pixel.green) < 25 && Math.abs(pixel.green - pixel.blue) < 25 && Math.abs(pixel.blue - pixel.red) < 25;
    };

    /**
     *
     * @param {ImageData} image
     * @param {number} offset
     * @returns {{red: number, green: number, blue: number}}
     */
    const getPixel = (image, offset) => {
      return {
        red: image.data[offset],
        green: image.data[offset + 1],
        blue: image.data[offset + 2]
      };
    };

    /**
     * @param {{red: number, green: number, blue: number}[]} pixels
     * @returns {{red: number, green: number, blue: number}}
     */
    const avgColor = (pixels) => {
      return {
        red: Math.round(pixels.reduce((sum, pixel) => sum + pixel.red, 0) / pixels.length),
        green: Math.round(pixels.reduce((sum, pixel) => sum + pixel.green, 0) / pixels.length),
        blue: Math.round(pixels.reduce((sum, pixel) => sum + pixel.blue, 0) / pixels.length)
      };
    };

    const rgbToHex = (pixel) => {
      return '#' + ((1 << 24) + (pixel.red << 16) + (pixel.green << 8) + pixel.blue).toString(16).slice(1);
    };

    if (this.canvas.current && this.video.current) {
      const ctx = this.canvas.current.getContext('2d');
      const { emulatorWidth, emulatorHeight } = this.props;
      ctx.drawImage(this.video.current, 0, 0, emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR, emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR);
      const rawImage = ctx.getImageData(0, 0, emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR, emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR);
      const borderPixels = [
        // Top Left
        getPixel(
          rawImage,
          rawImage.width * EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET * 4 + EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET * 4),
        // Top Right
        getPixel(
          rawImage,
          rawImage.width * EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET * 4 + (rawImage.width - EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET) * 4
        ),
        // Bottom Left
        getPixel(
          rawImage,
          rawImage.width * (rawImage.height - EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET) * 4 + EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET * 4
        ),
        // Bottom Right
        getPixel(
          rawImage,
          rawImage.width * (rawImage.height - EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET) * 4 + (rawImage.width - EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET) * 4
        )
      ];

      const centerPixels = [
        // Center Center
        getPixel(
          rawImage,
          rawImage.width * (rawImage.height / 2) * 4 + (rawImage.width / 2) * 4
        )
      ];

      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {
        hasVideo: ![].concat(borderPixels, centerPixels).every((pixel) => isDarkGrey(pixel)),
        borderColor: rgbToHex(avgColor(borderPixels)),
        screenshot: this.canvas.current.toDataURL('image/jpeg') // or 'image/png'
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
