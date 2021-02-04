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
  }

  componentDidMount() {
    this.isMountedInView = true;
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .on(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .on(StreamingEvent.USER_INTERACTION, this.onUserInteraction);
    this.setState({ video: false, audio: false }, () => this.props.jsep.startStream());
    // Performing 'health-check' of the stream and reporting events when video is missing
    let timerEventCount = 0;
    this.timer = setInterval(() => {
      if (this.requireUserInteractionToPlay) {
        return; // Do not reporting any StreamingEvent.STREAM_VIDEO_MISSING if the stream is waiting for user interaction in order to start the stream.
      }

      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_MISSING);
      } else if (timerEventCount++ % (timerEventCount < 20 ? 2 : 10) === 0) {
        // During the session 10 sec, the system capture screen every 1 sec, then after 10 sec, capture screen every 5 sec
        this.captureVideoStream();
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
   * Capture the stream <video> element and check if the video stream is a black or grey.
   * @returns {string}
   */
  captureVideoStream = () => {
    const captureVideoStreamStartTime = Date.now();
    /**
     * Test if a color is dark grey (including total black)
     * @param {{red: number, green: number, blue: number}} pixel
     * @returns {boolean}
     */
    const isDarkGrey = (pixel) => {
      return (
        pixel.red < 50 &&
        pixel.green < 50 &&
        pixel.blue < 50 &&
        Math.abs(pixel.red - pixel.green) < 25 &&
        Math.abs(pixel.green - pixel.blue) < 25 &&
        Math.abs(pixel.blue - pixel.red) < 25
      );
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
      ctx.drawImage(
        this.video.current,
        0,
        0,
        emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR,
        emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR
      );
      const rawImage = ctx.getImageData(
        0,
        0,
        emulatorWidth / EmulatorWebrtcView.CANVAS_SCALE_FACTOR,
        emulatorHeight / EmulatorWebrtcView.CANVAS_SCALE_FACTOR
      );
      const offset = EmulatorWebrtcView.SCREEN_DETECTOR_OFFSET;
      const borderPixels = [
        getPixel(rawImage, rawImage.width * offset * 4 + offset * 4), // Top Left
        getPixel(rawImage, rawImage.width * offset * 4 + (rawImage.width / 2) * 4), // Top Middle
        getPixel(rawImage, rawImage.width * offset * 4 + (rawImage.width - offset) * 4), // Top Right
        getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + (rawImage.width - offset) * 4), // Middle Right
        getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + offset * 4), // Bottom Left
        getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + (rawImage.width / 2) * 4), // Bottom Right
        getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + (rawImage.width - offset) * 4), // Bottom Right
        getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + offset * 4) // Middle Left
      ];
      const centerPixels = [
        getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + (rawImage.width / 2) * 4) // Center Center
      ];

      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {
        hasVideo: ![].concat(borderPixels, centerPixels).every((pixel) => isDarkGrey(pixel)),
        borderColor: rgbToHex(avgColor(borderPixels)),
        captureProcessingTime: Date.now() - captureVideoStreamStartTime,
        screenshot: this.canvas.current.toDataURL('image/jpeg') // or 'image/png'
      });
    }
  };

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
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_READY);
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
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <video
          ref={this.video}
          style={style}
          muted={true} // Un-muting is done dynamically through ref on userInteraction
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
