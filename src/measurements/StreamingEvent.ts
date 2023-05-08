import EventEmitter from 'eventemitter3';

/**
 * Extend Event Emitter with an emit that always send the event to 'event' target
 */
class ExtendedEventEmitter extends EventEmitter {
  edgeNodeId?: string;

  constructor(edgeNodeId?: string) {
    super();
    this.edgeNodeId = edgeNodeId;
  }

  /**
   * Check if a debug method called applandStreamingRawEventCallback exist, if so invoke it with the raw event data.
   * Example implementation in puppeteer test framework.
   * ```
   * await browser.page().exposeFunction('applandStreamingRawEventCallback', (edgeNodeId, event, data) => {
   *   console.log(edgeNodeId, event, data);
   * });
   * ```
   */
  invokeTestFrameworkRawEventCallback(type: string | symbol, event: any): any {
    return (window as any).applandStreamingRawEventCallback?.(this.edgeNodeId, type, event);
  }

  /**
   * Event an event
   */
  emit(event: string | symbol, data: any): boolean {
    this.invokeTestFrameworkRawEventCallback(event, data);
    return this._emit(event, data);
  }

  /**
   * Private version of the emit, should not be called outside this file
   */
  _emit(event: string | symbol, data: any): boolean {
    super.emit('event', event, data);
    return super.emit(event, data);
  }
}

const globalEventEmitter = new ExtendedEventEmitter();
const edgeNodeEventEmitter = {};

// Get EventEmitter for a specific Edge Node Id.
// This will automatically create a new Event emitter if missing.
function edgeNode(edgeNodeId: string): ExtendedEventEmitter {
  if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
    edgeNodeEventEmitter[edgeNodeId] = new ExtendedEventEmitter(edgeNodeId);
    emit(StreamingEvent.NEW_EDGE_NODE, edgeNodeId);
  }
  return edgeNodeEventEmitter[edgeNodeId];
}

/**
 * Destroy all the EventEmitter for a specific edge node and force unsubscribe all listeners
 * that are subscribed for edge node events.
 */
function destroyEdgeNode(edgeNodeId: string) {
  const emitter = edgeNodeEventEmitter[edgeNodeId];
  if (emitter) {
    delete edgeNodeEventEmitter[edgeNodeId];
    emitter.removeAllListeners();
    emit(StreamingEvent.DESTROY_EDGE_NODE, edgeNodeId);
  }
}

/**
 * Emit an event to the global scope and all edge node scopes.
 */
function emit(event: string, data: any) {
  globalEventEmitter.emit(event, data);
  for (let edgeNodeId in edgeNodeEventEmitter) {
    if (edgeNodeEventEmitter[edgeNodeId]) {
      edgeNodeEventEmitter[edgeNodeId]._emit(event, data);
    }
  }
}

const StreamingEvent = {
  // Event of log with payload {type: string, data: []*}
  LOG: 'log',

  // Error event with an exception as payload
  ERROR: 'error',

  // StreamSocket error
  SOCKET_ERROR: 'socket-error',

  // Event fired when browser error occurs
  ERROR_BROWSER: 'error-browser',

  // Event fired when a touch or click has started
  TOUCH_START: 'touch-start',

  // Event fired when a new RTT value based on a touch has been detected
  TOUCH_RTT: 'touch-rtt',

  // Event fired when a touch rtt times out
  TOUCH_RTT_TIMEOUT: 'touch-rtt-timeout',

  // Event that is fire when the SDK receiving the edge node are ready to accept a connection.
  EDGE_NODE_READY_TO_ACCEPT_CONNECTION: 'edge-node-ready-to-accept-connection',

  // Web RTC measurement with payload created from {RTCPeerConnection.getStats}
  WEB_RTC_MEASUREMENT: 'web-rtc-measurement',

  // Event requesting Web RTC measurement from {RTCPeerConnection.getStats}
  REQUEST_WEB_RTC_MEASUREMENT: 'request-web-rtc-measurement',

  // Event of network RTT with payload {number} in millisecond
  ROUND_TRIP_TIME_MEASUREMENT: 'round-trip-time-measurement',

  // time offset
  TIME_OFFSET_MEASUREMENT: 'time-offset-measurement',

  // Event of webrtc client connected
  WEBRTC_CLIENT_CONNECTED: 'webrtc-client-connected',

  // Event of webrtc RTT with payload {number} in millisecond
  WEBRTC_ROUND_TRIP_TIME_MEASUREMENT: 'webrtc-round-trip-time-measurement',

  // Final report that should be sent up to the backend with a report of all measurement
  REPORT_MEASUREMENT: 'report-measurement',

  // Event fired when the current location/data center has no free allocations for this edge node
  // and result in the edge node is queued until required capacity in the datacenter is available.
  SERVER_OUT_OF_CAPACITY: 'server-out-of-capacity',

  // Event fired when the peer connection has been selected and the system know how it is connected to the backend.
  PEER_CONNECTION_SELECTED: 'peer-connection-selected',

  // Event fired when the stream is connected to the backend and the consumer receiving a video stream.
  STREAM_CONNECTED: 'stream-connected',

  // Event fired when the stream is disconnected from the backend and no video or no audio is available.
  STREAM_DISCONNECTED: 'stream-disconnected',

  // Event that is fired when the stream enters an unreachable and none recoverable state.
  STREAM_UNREACHABLE: 'stream-unreachable',

  // Event that is fired when the edge node crashes.
  EDGE_NODE_CRASHED: 'edge-node-crashed',

  // Backend signal the stream are in progress to be terminated.
  STREAM_TERMINATED: 'stream-terminated',

  // Backend signal the stream are paused now.
  STREAM_PAUSED: 'stream-paused',

  // Backend signal the stream are resumed now.
  STREAM_RESUMED: 'stream-resumed',

  // Event fired when the stream is reloaded during auto recovery process from an error.
  STREAM_RELOADED: 'stream-reloaded',

  // Event fired when the video stream started playing (resume from paused or started)
  STREAM_VIDEO_PLAYING: 'stream-video-playing',

  // Event fired the event oncanplay is happen on the video DOM element after the tracks has been added.
  STREAM_VIDEO_CAN_PLAY: 'stream-video-can-play',

  // Event fired when the video is available and can be played.
  STREAM_VIDEO_AVAILABLE: 'stream-video-available',

  // Event fired when the video is not longer available.
  STREAM_VIDEO_UNAVAILABLE: 'stream-video-unavailable',

  // Event fired when the video is missing but not certainly unavailable.
  STREAM_VIDEO_MISSING: 'stream-video-missing',

  // Event fired when a user interaction is required in order to start video playing
  REQUIRE_USER_PLAY_INTERACTION: 'require-user-play-interaction',

  // Event fired when a thumbnail screenshot of the video has been created.
  STREAM_VIDEO_SCREENSHOT: 'stream-video-screenshot',

  // Event fires when a black screen occurs on the user viewport
  STREAM_BLACK_SCREEN: 'stream-black-screen',

  // Event fires on first user interaction with audio codec
  STREAM_AUDIO_CODEC: 'stream-audio-codec',

  // Event fires on first user interaction with video codec
  STREAM_VIDEO_CODEC: 'stream-video-codec',

  // Event fired when the user interact with a running stream.
  USER_INTERACTION: 'user-interaction',

  // Event fired when receiving emulator configuration during initialization of P2P connection
  EMULATOR_CONFIGURATION: 'emulator-configuration',

  // Event fired for every emulator stage completion.
  EMULATOR_LOADING_PROGRESS: 'emulator-loading-progress',

  // Event fired when the stream quality rating has been updated.
  STREAM_QUALITY_RATING: 'stream-quality-rating',

  // Event fired when the audio is available and can be un-muted.
  STREAM_AUDIO_AVAILABLE: 'stream-audio-available',

  // Event fired when the audio is not longer available.
  STREAM_AUDIO_UNAVAILABLE: 'stream-audio-unavailable',

  // Event fired when the audio unmute action paused the video
  STREAM_AUDIO_UNMUTE_ERROR: 'stream-audio-unmute-error',

  // Report that should be sent up to the backend from user clicked play until stream video is playing
  STREAM_LOADING_TIME: 'stream-loading-time',

  // Event fired when the webrtc video stream is available and can be played by the browser
  STREAM_WEBRTC_READY: 'stream-webrtc-ready',

  // Event fired when the emulator is ready and first input lag fix has been applied.
  STREAM_EMULATOR_READY: 'stream-emulator-ready',

  // Event fired when the video stream is available and "play" button can be displayed for the end user,
  // this will only happen after both STREAM_WEBRTC_READY and STREAM_EMULATOR_READY has been received.
  STREAM_READY: 'stream-ready',

  // Event fired when User Event Report is submitted
  USER_EVENT_REPORT: 'user-event-report',

  // Event fired when the user starts playing the game
  USER_STARTS_PLAYING: 'user-starts-playing',

  // Custom moment event send by moment event detector to SDK.
  MOMENT_DETECTOR_EVENT: 'moment-detector-event',

  // Event fired many times during a game session after (re)evaluation of the predicted game experience.
  PREDICTED_GAME_EXPERIENCE: 'predicted-game-experience',

  // Event fired when the new edgeWorker is detected by StreamingEvent handler.
  NEW_EDGE_WORKER: 'new-edge-worker',

  // Event fired when the new edge node is detected by StreamingEvent handler.
  NEW_EDGE_NODE: 'new-edge-node',

  // Event fired by StreamingEvent when the edge node has been destroyed.
  DESTROY_EDGE_NODE: 'destroy-edge-node',

  // Event fired at the end of the stream with the collected measurement report
  CLASSIFICATION_REPORT: 'classification-report',

  // functions
  edgeNode,
  destroyEdgeNode,
  emit,
};

export default StreamingEvent;
