import React, { CSSProperties, Component } from 'react';
import * as StreamingEvent from '../../../StreamingEvent.js';
import StreamCaptureService from '../../../service/StreamCaptureService.js';
import JsepProtocol from '../net/JsepProtocol.js';
import { Logger } from '../../../../measurements/Logger.js';

const rttMeasurementTimeout = 500;
const touchAnimTime = 200;

type EmulatorWebrtcViewProps = {
  /** gRPC Endpoint where we can reach the emulator. */
  uri: string;
  /** Streaming Edge node ID */
  edgeNodeId: string;
  /** Event Logger */
  logger: Logger;
  /** Jsep protocol driver, used to establish the video stream. */
  jsep: JsepProtocol;
  /** Volume of the video element, value between 0 and 1.  */
  volume: number;
  /** Audio is muted or enabled (un-muted) */
  muted?: boolean;
  /** The width of the screen/video feed provided by the emulator */
  emulatorWidth: number;
  /** The height of the screen/video feed provided by the emulator */
  emulatorHeight: number;
  emulatorVersion?: string;
  /** Defines if touch rtt should be measured */
  measureTouchRtt?: boolean;
};

const videostyle: CSSProperties = {
  margin: '0 auto',
  width: '100%',
  height: '100%',
};

const visibleVideoStyle: CSSProperties = { ...videostyle, visibility: 'visible' };
const hiddenVideoStyle: CSSProperties = { ...videostyle, visibility: 'hidden' };

/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams.
 */
export default class EmulatorWebrtcView extends Component<EmulatorWebrtcViewProps> {
  state = {
    audio: false,
    video: false,
    playing: false,
  };

  video = React.createRef<HTMLVideoElement>();
  canvas = React.createRef<HTMLCanvasElement>();
  canvasTouch = React.createRef<HTMLCanvasElement>();
  isMountedInView = false;
  captureScreenMetaData = [];
  requireUserInteractionToPlay = false;
  frameTimestamps: number[] = [];
  streamCaptureService: StreamCaptureService;
  streamHealthcheckIntervalId: number;
  touchTimerId: number;

  constructor(props: EmulatorWebrtcViewProps) {
    super(props);
    this.streamCaptureService = new StreamCaptureService(this.props.edgeNodeId, this.video, this.canvas, this.canvasTouch);
  }

  componentDidMount() {
    this.isMountedInView = true;
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .on(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .on(StreamingEvent.USER_INTERACTION, this.onUserInteraction)
      .on(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);

    if (this.props.measureTouchRtt) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.TOUCH_START, this.onTouchStart);
      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.TOUCH_END, this.onTouchEnd);
    }

    this.setState({ video: false, audio: false }, () => this.props.jsep.startStream());
    // Performing 'health-check' of the stream and reporting events when video is missing
    this.streamHealthcheckIntervalId = window.setInterval(() => {
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
    if (this.streamHealthcheckIntervalId) {
      window.window.clearInterval(this.streamHealthcheckIntervalId);
    }
    StreamingEvent.edgeNode(this.props.edgeNodeId)
      .off(StreamingEvent.STREAM_CONNECTED, this.onConnect)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onDisconnect)
      .off(StreamingEvent.USER_INTERACTION, this.onUserInteraction)
      .off(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT, this.onRequestWebRtcMeasurement);

    if (this.props.measureTouchRtt) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).off(StreamingEvent.TOUCH_START, this.onTouchStart);
      StreamingEvent.edgeNode(this.props.edgeNodeId).off(StreamingEvent.TOUCH_END, this.onTouchEnd);
    }

    this.props.jsep.disconnect();
  }

  componentDidUpdate(prevProps: EmulatorWebrtcViewProps) {
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
      this.video.current.muted = !!this.props.muted;
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

  lastTouchEnd = 0;

  onTouchEnd = () => {
    this.lastTouchEnd = new Date().getTime();
  };

  onTouchStart = (event: StreamingEvent.TOUCH_START_PAYLOAD[0]) => {
    if (this.lastTouchEnd + touchAnimTime > new Date().getTime()) {
      return;
    }

    if (this.touchTimerId !== undefined) {
      cancelAnimationFrame(this.touchTimerId);
    }

    const startTime = performance.now();

    const runTouchDetection = (timestamp: number) => {
      const foundCircle = this.streamCaptureService.detectTouch(event.x, event.y, this.props.emulatorWidth, this.props.emulatorHeight);

      if (foundCircle) {
        const rtt = timestamp - startTime;
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.TOUCH_RTT, { rtt: rtt });
      } else if (timestamp > startTime + rttMeasurementTimeout) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.TOUCH_RTT_TIMEOUT, {
          timeout: true,
          time: rttMeasurementTimeout,
        });
      } else {
        requestAnimationFrame(runTouchDetection);
      }
    };

    this.touchTimerId = requestAnimationFrame(runTouchDetection);
  };

  onDisconnect = () => {
    if (this.isMountedInView) {
      this.setState({ video: false, audio: false }, () => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_UNAVAILABLE);
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_UNAVAILABLE);
      });
    }
  };

  onConnect = (track: MediaStreamTrack) => {
    const video = this.video.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    if (!video.srcObject) {
      video.srcObject = new MediaStream();
    }

    if (track.kind === 'video') {
      // If the browser has the capability, we insert a "transform" that will get
      // the timestamp of each frame for later processing.
      // This API is (as of 2023-01-19) only available in Chrome, and
      // MediaStreamTrackGenerator will at some point be renamed VideoTrackGenerator
      // @ts-ignore badly typed by someone else
      if (window.MediaStreamTrackProcessor && window.MediaStreamTrackGenerator) {
        // @ts-ignore badly typed by someone else
        const trackProcessor = new window.MediaStreamTrackProcessor({ track });
        // @ts-ignore badly typed by someone else
        const trackGenerator = new window.MediaStreamTrackGenerator({ kind: 'video' });

        const transformer = new TransformStream({
          transform: async (videoFrame, controller) => {
            this.frameTimestamps.push(new Date().getTime());
            controller.enqueue(videoFrame);
          },
        });
        trackProcessor.readable.pipeThrough(transformer).pipeTo(trackGenerator.writable);
        // @ts-ignore badly typed by someone else
        video.srcObject.addTrack(trackGenerator);
      } else {
        // @ts-ignore badly typed by someone else
        video.srcObject.addTrack(track);
      }
      this.setState({ video: true }, () => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_AVAILABLE);
      });
    }

    if (track.kind === 'audio') {
      // @ts-ignore badly typed
      video.srcObject.addTrack(track);
      this.setState({ audio: true }, () => StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_AUDIO_AVAILABLE));
    }
  };

  /**
   * Promise Timeout
   * @param {number} timeoutDuration
   * @returns {Promise<undefined>}
   */
  timeout = (timeoutDuration: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), timeoutDuration);
    });
  };

  onCanPlay = () => {
    const video = this.video.current;
    if (!video) {
      this.props.logger.error('Video DOM element not ready');
      return; // Component was unmounted.
    }

    // This code snippet allow us to detect and calculate the amount of time the stream is buffed/delayed on client side between received to displayed for consumer.
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
            StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_WEBRTC_READY, onUserInteractionCallback);
          });
      } else {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_WEBRTC_READY, onUserInteractionCallback);
      }
      this.props.logger.info('Video stream was already playing');
    } else {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_WEBRTC_READY, onUserInteractionCallback);
    }
  };

  onPlaying = () => {
    this.requireUserInteractionToPlay = false;
    this.setState({ playing: true });
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_PLAYING);

    this.props.jsep.peerConnection &&
      this.props.jsep.peerConnection.getStats().then((stats) => {
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            // @ts-ignore badly typed
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

  onContextMenu = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.preventDefault();
  };

  onRequestWebRtcMeasurement = async () => {
    if (this.props.jsep.peerConnectionInitialized()) {
      try {
        const { stats, synchronizationSource } = await this.props.jsep.getWebRtcStats();
        const frameTimestamps = this.frameTimestamps;
        this.frameTimestamps = [];

        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.WEB_RTC_MEASUREMENT, {
          stats: stats!,
          synchronizationSource,
          frameTimestamps,
        });
      } catch (err) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.ERROR, err);
        console.warn(err);
      }
    }
  };

  render() {
    const { emulatorWidth, emulatorHeight } = this.props;

    const style = this.state.playing ? visibleVideoStyle : hiddenVideoStyle;

    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <video
          ref={this.video}
          style={style}
          className="video-webrtc"
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
        <canvas style={{ display: 'none' }} ref={this.canvasTouch} height="23" width="23" />
      </div>
    );
  }
}
