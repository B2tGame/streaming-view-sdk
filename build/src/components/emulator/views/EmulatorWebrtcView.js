"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

var _StreamCaptureService = _interopRequireDefault(require("../../../service/StreamCaptureService"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const rttMeasurementTimeout = 500;
const touchAnimTime = 200;
/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams.
 */

class EmulatorWebrtcView extends _react.Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: false,
      video: false,
      playing: false
    };

    this.playVideo = () => {
      const video = this.video.current;

      if (video && video.paused) {
        return (video.play() || Promise.reject(new Error('video.play() was not a promise'))).then(() => {
          this.requireUserInteractionToPlay = false;
        }).catch(error => {
          this.props.logger.error("Fail to start playing stream by user interaction due to ".concat(error.name), error.message);
        });
      }

      this.requireUserInteractionToPlay = false;
      this.props.logger.info('Video stream was already playing');
    };

    this.onUserInteraction = () => {
      if (this.requireUserInteractionToPlay) {
        this.playVideo();
      }

      this.updateVideoMutedProp();
      this.updateVideoVolumeProp();

      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_MISSING);
      }
    };

    this.lastTouchEnd = 0;

    this.onTouchEnd = () => {
      this.lastTouchEnd = new Date().getTime();
    };

    this.onTouchStart = event => {
      if (this.lastTouchEnd + touchAnimTime > new Date().getTime()) {
        return;
      }

      if (this.touchTimer !== undefined) {
        cancelAnimationFrame(this.touchTimer);
      }

      const startTime = performance.now();

      const runTouchDetection = timestamp => {
        const foundCircle = this.streamCaptureService.detectTouch(event.x, event.y, this.props.emulatorWidth, this.props.emulatorHeight);

        if (foundCircle) {
          const rtt = timestamp - startTime;

          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_RTT, {
            rtt: rtt
          });
        } else if (timestamp > startTime + rttMeasurementTimeout) {
          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.TOUCH_RTT_TIMOUT, {
            timeout: true,
            time: rttMeasurementTimeout
          });
        } else {
          requestAnimationFrame(runTouchDetection);
        }
      };

      this.touchTimer = requestAnimationFrame(runTouchDetection);
    };

    this.onDisconnect = () => {
      if (this.isMountedInView) {
        this.setState({
          video: false,
          audio: false
        }, () => {
          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_UNAVAILABLE);

          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_AUDIO_UNAVAILABLE);
        });
      }
    };

    this.onConnect = track => {
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
        this.setState({
          video: true
        }, () => {
          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_AVAILABLE);
        });
      }

      if (track.kind === 'audio') {
        this.setState({
          audio: true
        }, () => _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_AUDIO_AVAILABLE));
      }
    };

    this.timeout = timeoutDuration => {
      return new Promise(resolve => {
        setTimeout(() => resolve(), timeoutDuration);
      });
    };

    this.onCanPlay = () => {
      const video = this.video.current;

      if (!video) {
        this.props.logger.error('Video DOM element not ready');
        return; // Component was unmounted.
      } // This code snippet allow us to detect and calculate the amount of time the stream is buffed/delayed on client side between received to displayed for consumer.
      // const requestVideoFrameCallback = (now, metadata) => {
      //   console.log(metadata.presentationTime - metadata.receiveTime);
      //   video.requestVideoFrameCallback(requestVideoFrameCallback);
      // };
      // video.requestVideoFrameCallback(requestVideoFrameCallback);


      const onUserInteractionCallback = () => {
        this.playVideo();
        this.updateVideoMutedProp();
        this.updateVideoVolumeProp();
      };

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_CAN_PLAY);

      if (!this.requireUserInteractionToPlay) {
        if (video.paused) {
          return (video.play() || Promise.resolve('video.play() was not a promise')).catch(error => {
            if (error.name === 'NotAllowedError') {
              // The user agent (browser) or operating system doesn't allow playback of media in the current context or situation.
              // This may happen, if the browser requires the user to explicitly start media playback by clicking a "play" button.
              this.requireUserInteractionToPlay = true;

              _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.REQUIRE_USER_PLAY_INTERACTION, onUserInteractionCallback);
            } else {
              this.props.logger.error("Fail to start playing stream due to ".concat(error.name), error.message);
            }
          }).finally(() => {
            _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_WEBRTC_READY, onUserInteractionCallback);
          });
        } else {
          _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_WEBRTC_READY, onUserInteractionCallback);
        }

        this.props.logger.info('Video stream was already playing');
      } else {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_WEBRTC_READY, onUserInteractionCallback);
      }
    };

    this.onPlaying = () => {
      this.requireUserInteractionToPlay = false;
      this.setState({
        playing: true
      });

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_PLAYING);

      this.props.jsep.peerConnection.getStats().then(stats => {
        stats.forEach(report => {
          if (report.type === 'inbound-rtp') {
            const codec = (stats.get(report.codecId) || {}).mimeType;

            if (report.kind === 'audio' && codec) {
              _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_AUDIO_CODEC, codec.replace('audio/', ''));
            } else if (report.kind === 'video' && codec) {
              _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_CODEC, codec.replace('video/', ''));
            }
          }
        });
      });
    };

    this.onContextMenu = e => {
      e.preventDefault();
    };

    this.video = /*#__PURE__*/_react.default.createRef();
    this.canvas = /*#__PURE__*/_react.default.createRef();
    this.canvasTouch = /*#__PURE__*/_react.default.createRef();
    this.isMountedInView = false;
    this.captureScreenMetaData = [];
    this.requireUserInteractionToPlay = false;
    this.streamCaptureService = new _StreamCaptureService.default(this.props.edgeNodeId, this.video, this.canvas, this.canvasTouch);
  }

  componentDidMount() {
    this.isMountedInView = true;

    _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.STREAM_CONNECTED, this.onConnect).on(_StreamingEvent.default.STREAM_DISCONNECTED, this.onDisconnect).on(_StreamingEvent.default.USER_INTERACTION, this.onUserInteraction);

    if (this.props.measureTouchRtt) {
      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.TOUCH_START, this.onTouchStart);

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).on(_StreamingEvent.default.TOUCH_END, this.onTouchEnd);
    }

    this.setState({
      video: false,
      audio: false
    }, () => this.props.jsep.startStream()); // Performing 'health-check' of the stream and reporting events when video is missing

    this.timer = setInterval(() => {
      if (this.requireUserInteractionToPlay) {
        return; // Do not reporting any StreamingEvent.STREAM_VIDEO_MISSING if the stream is waiting for user interaction in order to start the stream.
      }

      if (this.isMountedInView && this.video.current && this.video.current.paused) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_MISSING);
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

    _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off(_StreamingEvent.default.STREAM_CONNECTED, this.onConnect).off(_StreamingEvent.default.STREAM_DISCONNECTED, this.onDisconnect).off(_StreamingEvent.default.USER_INTERACTION, this.onUserInteraction);

    if (this.props.measureTouchRtt) {
      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off(_StreamingEvent.default.TOUCH_START, this.onTouchStart);

      _StreamingEvent.default.edgeNode(this.props.edgeNodeId).off(_StreamingEvent.default.TOUCH_END, this.onTouchEnd);
    }

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
      this.video.current.muted = this.props.muted; // If video was paused after unmuting, fire unmute error event, mute audio and play video
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes

      if (streamIsPaused === false && streamIsPaused !== this.video.current.paused) {
        _StreamingEvent.default.edgeNode(this.props.edgeNodeId).emit(_StreamingEvent.default.STREAM_AUDIO_UNMUTE_ERROR); // Play muted video, since browser may pause the video when un-muting action has failed


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

  render() {
    const {
      emulatorWidth,
      emulatorHeight
    } = this.props;
    const style = {
      margin: '0 auto',
      visibility: this.state.playing ? 'visible' : 'hidden',
      width: '100%',
      height: '100%'
    };
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, /*#__PURE__*/_react.default.createElement("video", {
      ref: this.video,
      style: style,
      className: "video-webrtc" // Initial muted value, un-muting is done dynamically through ref on userInteraction
      // Known issue: https://github.com/facebook/react/issues/10389
      ,
      muted: true,
      onContextMenu: this.onContextMenu,
      onCanPlay: this.onCanPlay,
      onPlaying: this.onPlaying,
      playsInline: true
    }), /*#__PURE__*/_react.default.createElement("canvas", {
      style: {
        display: 'none'
      },
      ref: this.canvas,
      height: emulatorHeight / _StreamCaptureService.default.CANVAS_SCALE_FACTOR,
      width: emulatorWidth / _StreamCaptureService.default.CANVAS_SCALE_FACTOR
    }), /*#__PURE__*/_react.default.createElement("canvas", {
      style: {
        display: 'none'
      },
      ref: this.canvasTouch,
      height: "23",
      width: "23"
    }));
  }

}

exports.default = EmulatorWebrtcView;
EmulatorWebrtcView.propTypes = {
  /** gRPC Endpoint where we can reach the emulator. */
  uri: _propTypes.default.string.isRequired,

  /** Streaming Edge node ID */
  edgeNodeId: _propTypes.default.string.isRequired,

  /** Event Logger */
  logger: _propTypes.default.object.isRequired,

  /** Jsep protocol driver, used to establish the video stream. */
  jsep: _propTypes.default.object,

  /** Volume of the video element, value between 0 and 1.  */
  volume: _propTypes.default.number,

  /** Audio is muted or enabled (un-muted) */
  muted: _propTypes.default.bool,

  /** The width of the screen/video feed provided by the emulator */
  emulatorWidth: _propTypes.default.number,

  /** The height of the screen/video feed provided by the emulator */
  emulatorHeight: _propTypes.default.number,
  emulatorVersion: _propTypes.default.string,

  /** Defines if touch rtt should be measured */
  measureTouchRtt: _propTypes.default.bool
};