import Emulator from './components/emulator/Emulator.js';
import React, { Component } from 'react';
import * as StreamingEvent from './StreamingEvent.js';
import StreamingController from './StreamingController.js';
import { v4 as uuid } from 'uuid';
import buildInfo from './build-info.json';
import * as log from '../measurements/Logger.js';
import StreamSocket from './service/StreamSocket.js';
import Measurement from './service/Measurement.js';
import LogQueueFactory, { LogQueueService } from './service/LogQueueService.js';
import BlackScreenDetector from './service/BlackScreenDetector.js';
import { IceServerInfo, requestIceServers } from './service/IceServer.js';
import watchRTC from '@testrtc/watchrtc-sdk';
import { MeasurementScheduler } from '../measurements/measurementScheduler.js';

const rtcApiKey = '432515f4-5896-4335-b967-2e4b16cbabbf';
watchRTC.init({ rtcApiKey });

type StreamingViewProps = {
  apiEndpoint: string; // Can't be changed after creation
  edgeNodeId: string; // Can't be changed after creation
  edgeNodeEndpoint?: string; // Can't be changed after creation
  turnEndpoint?: string; // Can't be changed after creation
  userId?: string; // Can't be changed after creation
  userAuthToken: string;
  enableControl?: boolean; // Can be changed dynamically
  enableFullScreen?: boolean; // Can be changed dynamically
  view: 'webrtc' | 'png'; // Can't be changed after creation
  volume?: number; // Can be changed dynamically, Volume between [0, 1] when audio is enabled. 0 is muted, 1.0 is 100%
  muted?: boolean; // Can be changed dynamically
  onEvent: () => void; // Can't be changed after creation
  streamQualityRating?: number; // Can be changed dynamically
  internalSession?: boolean; // Can't be changed after creation
  userClickedPlayAt: number; // Can't be changed after creation
  maxConnectionRetries?: number; // Can't be change after creation, Override the default threshold for now many time the SDK will try to reconnect to the stream
  height?: string;
  width?: string;
  measureTouchRtt?: boolean;
  measurementScheduler: MeasurementScheduler;
  playoutDelayHint?: number;
  vp8MaxQuantization?: number;
  preferH264?: boolean;
  disableWatchRTCStats?: boolean;
};

type StreamingViewState = {
  isReadyStream?: boolean;
  streamEndpoint?: string;
  turnEndpoint?: string;
  emulatorWidth?: number;
  emulatorHeight?: number;
  emulatorVersion?: string;
  shouldRandomlyMeasureRtt?: boolean;
  height: string;
  width: string;
  iceServers: IceServerInfo;
};

let instanceID = 0;
/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
export default class StreamingView extends Component<StreamingViewProps, StreamingViewState> {
  static defaultProps = {
    view: 'webrtc',
    enableFullScreen: true,
    enableControl: true,
    volume: 1.0,
    muted: false,
    measureTouchRtt: true,
    playoutDelayHint: 0,
    vp8MaxQuantization: 63,
  };

  /**
   * Player is a user with controls enabled
   * @return {string}
   */
  static get ROLE_PLAYER() {
    return 'player';
  }

  /**
   * Watcher is a user with controls disabled
   * @return {string}
   */
  static get ROLE_WATCHER() {
    return 'watcher';
  }

  instanceID = ++instanceID;
  isMountedInView = false;
  streamingViewId = uuid();
  emulatorIsReady = false;
  shouldRandomlyMeasureRtt: boolean;
  logQueueService: LogQueueService;
  measurement: Measurement;
  onResizeTimeoutId: number;
  blackScreenDetector: BlackScreenDetector;
  streamSocket: StreamSocket;

  constructor(props: StreamingViewProps) {
    super(props);
    this.state = {
      height: window.innerHeight + 'px',
      width: window.innerWidth + 'px',
      iceServers: { name: 'default', candidates: [] },
    };
    // Simple coinflip if we should measure rtt... if prop is not passed!
    if (props.measureTouchRtt === undefined) {
      this.shouldRandomlyMeasureRtt = Math.random() < 0.5;
    }
  }

  componentDidMount() {
    this.isMountedInView = true;
    const {
      apiEndpoint,
      edgeNodeId,
      userId,
      userAuthToken,
      edgeNodeEndpoint,
      internalSession,
      turnEndpoint,
      onEvent,
      measurementScheduler,
      disableWatchRTCStats,
    } = this.props;

    if (!disableWatchRTCStats) {
      watchRTC.setConfig({
        rtcApiKey,
        rtcPeerId: userId,
        rtcRoomId: edgeNodeId,
      });
      watchRTC.connect();
    }

    const { userClickedPlayAt } = this.props;
    if (!(userClickedPlayAt > 0)) {
      // TODO: Change this back to an error once it doesn't happen in the PWA and CMS
      console.error(
        'StreamingView: userClickedPlayAt must be a valid number. This will cause a crash in a later version of the streaming SDK.'
      );
      // throw new Error('StreamingView: userClickedPlayAt must be a valid number');
    }

    if (!internalSession) {
      this.logQueueService = LogQueueFactory(edgeNodeId, apiEndpoint, userId!, userAuthToken, this.streamingViewId);
    }

    this.blackScreenDetector = new BlackScreenDetector(edgeNodeId, this.streamingViewId);

    this.measurement = new Measurement(edgeNodeId, this.streamingViewId, log);

    if (onEvent) {
      StreamingEvent.edgeNode(edgeNodeId).on('event', onEvent);
    }

    if (this.props.measureTouchRtt === undefined) {
      // Run coinflip to in 50% of cases measure rtt
      this.setState({
        shouldRandomlyMeasureRtt: Math.random() < 0.5,
      });
    }

    log.info(
      'StreamingView was mounted',
      Object.entries(this.props)
        .filter(([_, propValue]) => typeof propValue !== 'function')
        .reduce((propObj, [propName, propValue]) => {
          // @ts-ignore - This is a valid way to set a key on an object, but TS doesn't like it
          propObj[propName] = propValue;
          return propObj;
        }, {} as Omit<StreamingViewProps, 'onEvent'>)
    );

    log.info(`SDK Version: ${buildInfo.tag}`);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('error', this.onError);

    let readyWasTriggered = false;

    const handleEmulatorReady = (onUserInteractionCallback: () => void) => {
      console.info(`Ready was triggered for instance ${this.instanceID}. ${readyWasTriggered ? 'Second trigger' : 'First trigger'}`);

      if (readyWasTriggered) {
        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.STREAM_READY, onUserInteractionCallback);
      } else {
        readyWasTriggered = true;
      }
    };

    StreamingEvent.edgeNode(edgeNodeId)
      .once(StreamingEvent.STREAM_UNREACHABLE, () => this.setState({ isReadyStream: false }))
      .once(StreamingEvent.STREAM_TERMINATED, () => {
        if (!this.props.disableWatchRTCStats) {
          watchRTC.disconnect();
        }
        this.measurement && this.measurement.destroy();
        this.streamSocket && this.streamSocket.close();
        this.setState({ isReadyStream: false });
      })
      .on(StreamingEvent.EMULATOR_CONFIGURATION, (configuration) => {
        this.setState({
          emulatorWidth: configuration.emulatorWidth,
          emulatorHeight: configuration.emulatorHeight,
          emulatorVersion: configuration.emulatorVersion,
        });
      })
      .on(StreamingEvent.STREAM_WEBRTC_READY, (onUserInteractionCallback) => {
        console.info(StreamingEvent.STREAM_WEBRTC_READY);
        handleEmulatorReady(onUserInteractionCallback);
      })
      .on(StreamingEvent.STREAM_EMULATOR_READY, (onUserInteractionCallback) => {
        console.info(StreamingEvent.STREAM_EMULATOR_READY);
        handleEmulatorReady(onUserInteractionCallback);
      });

    const controller = new StreamingController.StreamingController({
      apiEndpoint: apiEndpoint,
      edgeNodeId: edgeNodeId,
      internalSession: internalSession,
    });

    controller
      .waitWhile((data) => data.endpoint === undefined)
      .then((data) => {
        if (data.state === 'terminated') throw new Error('Edge Node is terminated');
        return data.endpoint;
      })
      .then((streamEndpoint) => {
        // if the SDK are in internal session mode and a value has been pass to edge node endpoint use that value instead of the
        // public endpoint received from Service Coordinator.
        streamEndpoint = internalSession && edgeNodeEndpoint ? edgeNodeEndpoint : streamEndpoint;
        this.streamSocket = new StreamSocket(edgeNodeId, streamEndpoint, userId!, !!internalSession);
        return Promise.all([streamEndpoint, controller.waitWhile((data) => !data.isReadyToAcceptConnection)]);
      })
      .then(([streamEndpoint, _]) => requestIceServers(apiEndpoint, edgeNodeId).then((iceServers) => [streamEndpoint, iceServers] as const))
      .then(([streamEndpoint, iceServers]) => {
        if (this.measurement) {
          this.measurement.initWebRtc(`${new URL(streamEndpoint).origin}/measurement/webrtc`, iceServers);
        }
        if (!this.isMountedInView) {
          log.info('Canceling action because the view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }

        StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.EDGE_NODE_READY_TO_ACCEPT_CONNECTION);

        this.setState({
          isReadyStream: true,
          streamEndpoint: streamEndpoint,
          turnEndpoint: internalSession && turnEndpoint ? turnEndpoint : undefined,
          iceServers: iceServers,
        });

        StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STREAM_EMULATOR_READY, measurementScheduler.stopMeasuring);
        StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STREAM_TERMINATED, measurementScheduler.startMeasuring);

        this.registerUserEventsHandler(userClickedPlayAt);
      })
      .catch((err) => {
        if (!this.isMountedInView) {
          log.info('Canceling action because the view is not mounted.');
          return; // Cancel any action if we not longer are mounted.
        }
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_UNREACHABLE, `Due to ${err.message}: ${err}`);
        console.warn(err);
      });
  }

  componentDidUpdate() {
    // If for some reason the measure touchrtt is
    if (this.props.measureTouchRtt === undefined && this.state.shouldRandomlyMeasureRtt === undefined) {
      // Run coinflip to in 50% of cases measure rtt
      this.setState({
        shouldRandomlyMeasureRtt: Math.random() < 0.5,
      });
    }
  }

  componentWillUnmount() {
    if (!this.props.disableWatchRTCStats) {
      watchRTC.disconnect();
    }
    log.info('StreamingView component will unmount', {
      measurement: this.measurement ? 'should-be-destroy' : 'skip',
      websocket: this.streamSocket ? 'should-be-destroy' : 'skip',
      blackScreenDetector: this.blackScreenDetector ? 'should-be-destroy' : 'skip',
      logQueueService: this.logQueueService ? 'should-be-destroy' : 'skip',
    });
    this.isMountedInView = false;

    this.measurement?.destroy();
    this.streamSocket?.close();
    this.blackScreenDetector?.destroy();
    this.logQueueService?.destroy();

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('error', this.onError);
    StreamingEvent.destroyEdgeNode(this.props.edgeNodeId);
    StreamingEvent.edgeNode(this.props.edgeNodeId).removeListener(
      StreamingEvent.STREAM_EMULATOR_READY,
      this.props.measurementScheduler.stopMeasuring
    );
    StreamingEvent.edgeNode(this.props.edgeNodeId).removeListener(
      StreamingEvent.STREAM_TERMINATED,
      this.props.measurementScheduler.startMeasuring
    );
  }

  /**
   * Update the state parameter heigth and width when screen size is changeing.
   */
  onResize = () => {
    if (this.onResizeTimeoutId) {
      window.clearTimeout(this.onResizeTimeoutId);
    }
    this.onResizeTimeoutId = window.setTimeout(() => {
      if (this.isMountedInView) {
        this.setState({
          height: window.innerHeight + 'px',
          width: window.innerWidth + 'px',
        });
      }
    }, 50);
  };

  /**
   * Trigger event when error occurs
   */
  onError = (error: ErrorEvent) => {
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.ERROR_BROWSER, {
      message: error.message,
      filename: error.filename,
      // @ts-ignore
      stack: error.stack,
    });
    return false;
  };

  shouldComponentUpdate(nextProps: StreamingViewProps, nextState: StreamingViewState) {
    // List of fields that should not generate into a render operation.
    const whiteListedFields = ['streamQualityRating', 'onEvent'];
    if (nextProps.streamQualityRating !== this.props.streamQualityRating) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.STREAM_QUALITY_RATING, {
        streamQualityRating: nextProps.streamQualityRating,
      });
    }

    if (nextProps.onEvent !== this.props.onEvent) {
      if (this.props.onEvent) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).off('event', this.props.onEvent);
      }
      if (nextProps.onEvent) {
        StreamingEvent.edgeNode(this.props.edgeNodeId).on('event', nextProps.onEvent);
      }
    }

    // Do not render if there are only changes in the whitelisted props attributes.
    const hasChanges = Object.keys(nextProps).filter((key: keyof StreamingViewProps) => nextProps[key] !== this.props[key]);

    if (hasChanges.length > 0) {
      return hasChanges.filter((key) => whiteListedFields.indexOf(key) === -1).length !== 0;
    } else {
      return this.state !== nextState;
    }
  }

  /**
   * Register user event handler reporting different user events through Stream Socket into Supervisor
   */
  registerUserEventsHandler(userClickedPlayAt: number) {
    // Report user event - stream-loading-time
    StreamingEvent.edgeNode(this.props.edgeNodeId).once(StreamingEvent.STREAM_READY, () => {
      const role = this.props.enableControl ? StreamingView.ROLE_PLAYER : StreamingView.ROLE_WATCHER;

      // Send the stream loading time if we have a user clicked play at props.
      const streamLoadingTime = Date.now() - userClickedPlayAt;
      const userEventPayload = {
        role: role,
        eventType: StreamingEvent.STREAM_LOADING_TIME,
        value: streamLoadingTime,
        message: `User event - ${StreamingEvent.STREAM_LOADING_TIME}: ${streamLoadingTime} ms.`,
      };
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, userEventPayload);

      // Send the video playing event when user can see the stream.
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
        role: role,
        eventType: StreamingEvent.USER_STARTS_PLAYING,
        value: 1,
        message: `User event - ${StreamingEvent.USER_STARTS_PLAYING}: Video is playing.`,
      });

      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_AUDIO_CODEC, (codec) => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
          role: role,
          eventType: StreamingEvent.STREAM_AUDIO_CODEC,
          value: codec,
          message: `User event - ${StreamingEvent.STREAM_AUDIO_CODEC}: ${codec}`,
        });
      });

      StreamingEvent.edgeNode(this.props.edgeNodeId).on(StreamingEvent.STREAM_VIDEO_CODEC, (codec) => {
        StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_EVENT_REPORT, {
          role: role,
          eventType: StreamingEvent.STREAM_VIDEO_CODEC,
          value: codec,
          message: `User event - ${StreamingEvent.STREAM_VIDEO_CODEC}: ${codec}.`,
        });
      });
    });
  }

  render() {
    const {
      enableControl,
      enableFullScreen,
      view,
      volume,
      muted,
      edgeNodeId,
      height: propsHeight,
      width: propsWidth,
      playoutDelayHint,
      vp8MaxQuantization,
      preferH264,
    } = this.props;
    const { height: stateHeight, width: stateWidth, iceServers } = this.state;

    switch (this.state.isReadyStream) {
      case true:
        return (
          <div style={{ height: propsHeight || stateHeight, width: propsWidth || stateWidth }} id={this.streamingViewId}>
            <Emulator
              uri={this.state.streamEndpoint!}
              turnEndpoint={this.state.turnEndpoint}
              enableControl={enableControl}
              enableFullScreen={enableFullScreen}
              view={view}
              volume={volume}
              muted={muted}
              poll={true}
              emulatorWidth={this.state.emulatorWidth}
              emulatorHeight={this.state.emulatorHeight}
              emulatorVersion={this.state.emulatorVersion}
              logger={log}
              edgeNodeId={edgeNodeId}
              maxConnectionRetries={this.props.maxConnectionRetries}
              measureTouchRtt={this.props.measureTouchRtt ?? this.state.shouldRandomlyMeasureRtt}
              playoutDelayHint={playoutDelayHint}
              iceServers={iceServers}
              vp8MaxQuantization={vp8MaxQuantization}
              preferH264={preferH264}
            />
          </div>
        );
      case false:
        return (
          <p id={this.streamingViewId} style={{ color: 'white' }}>
            EdgeNode Stream is unreachable
          </p>
        );
      default:
        return (
          <p style={{ color: 'white' }} className={'streaming-view-loading-edge-node'}>
            Loading EdgeNode Stream
          </p>
        );
    }
  }
}
