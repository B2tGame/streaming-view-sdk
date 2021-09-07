import EventEmitter from 'eventemitter3';
import Logger from './Logger';

/**
 * Extend Event Emitter with an emit that always send the event to 'event' target
 */
class ExtendedEventEmitter extends EventEmitter {

  /**
   * @param {string} edgeNodeId
   */
  constructor(edgeNodeId = undefined) {
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
   * @param {string} type
   * @param {*} event
   */
  invokeTestFrameworkRawEventCallback(type, event) {
    if ((window || {}).applandStreamingRawEventCallback) {
      (window || {}).applandStreamingRawEventCallback(this.edgeNodeId, type, event);
    }
  }

  /**
   * Event an event
   * @param {string} event
   * @param {*} data
   * @return {ExtendedEventEmitter}
   */
  emit(event, data) {
    if (Logger.isVerboseEnabled() && event !== StreamingEvent.LOG) {
      // Event all event except for the StreamingEvent.LOG since that has already been logged out .
      console.info('Streaming SDK:', event, data);
    }
    this.invokeTestFrameworkRawEventCallback(event, data);
    return this._emit(event, data);
  }

  /**
   * Private version of the emit, should not be called outside this file
   * @param {string} event
   * @param {*} data
   * @return {ExtendedEventEmitter}
   * @private
   */
  _emit(event, data) {
    super.emit('event', event, data);
    super.emit(event, data);
    return this;
  }

  /**
   * When one or more events were received at least once.
   * @param {string[]} events List of one or more events to wait in before calling the callback.
   * @param {function} callback Callback, argument list data payload for each event in the same order as the events list
   */
  on(events, callback) {
    if (!Array.isArray(events)) {
      return super.on(events, callback);
    } else {
      const eventData = {};
      super.on('event', (event, data) => {
        if (events.includes(event)) {
          eventData[event] = data || undefined;
          if (Object.keys(eventData).length === events.length) {
            callback(events.map((e) => eventData[e]));
          }
        }
      });
    }
  }
}

const globalEventEmitter = new ExtendedEventEmitter();
const edgeNodeEventEmitter = {};

/**
 * Streaming Event Emitter bus for sending and receiving event across the SDK.
 */
export default class StreamingEvent {
  /**
   * Event of log with payload {type: string, data: []*}
   * @return {string}
   */
  static get LOG() {
    return 'log';
  }

  /**
   * Error event with an exception as payload
   * @return {string}
   */
  static get ERROR() {
    return 'error';
  }

  /**
   * Event fired when browser error occurs
   * @return {string}
   */
  static get ERROR_BROWSER() {
    return 'error-browser';
  }

  /**
   * Event that is fire when the SDK receiving the edge node are ready to accept a connection.
   * @return {string}
   */
  static get EDGE_NODE_READY_TO_ACCEPT_CONNECTION() {
    return 'edge-node-ready-to-accept-connection';
  }

  /**
   * Web RTC measurement with payload created from {RTCPeerConnection.getStats}
   * @return {string}
   */
  static get WEB_RTC_MEASUREMENT() {
    return 'web-rtc-measurement';
  }

  /**
   * Event requesting Web RTC measurement from {RTCPeerConnection.getStats}
   * @return {string}
   */
  static get REQUEST_WEB_RTC_MEASUREMENT() {
    return 'request-web-rtc-measurement';
  }

  /**
   * Event of network RTT with payload {number} in millisecond
   * @return {string}
   */
  static get ROUND_TRIP_TIME_MEASUREMENT() {
    return 'round-trip-time-measurement';
  }

  /**
   * Event of webrtc client connected
   * @return {string}
   */
  static get WEBRTC_CLIENT_CONNECTED() {
    return 'webrtc-client-connected';
  }

  /**
   * Event of webrtc RTT with payload {number} in millisecond
   * @return {string}
   */
  static get WEBRTC_ROUND_TRIP_TIME_MEASUREMENT() {
    return 'webrtc-round-trip-time-measurement';
  }

  /**
   * Final report that should be sent up to the backend with a report of all measurement
   * @return {string}
   */

  static get REPORT_MEASUREMENT() {
    return 'report-measurement';
  }

  /**
   * Event fired when the current location/data center has no free allocations for this edge node
   * and result in the edge node is queued until required capacity in the datacenter is available.
   * @returns {string}
   */
  static get SERVER_OUT_OF_CAPACITY() {
    return 'server-out-of-capacity';
  }

  /**
   * Event fired when the peer connection has been selected and the system know how it is connected to the backend.
   * @returns {string}
   */
  static get PEER_CONNECTION_SELECTED() {
    return 'peer-connection-selected';
  }

  /**
   * Event fired when the stream is connected to the backend and the consumer receiving a video stream.
   * @returns {string}
   */
  static get STREAM_CONNECTED() {
    return 'stream-connected';
  }

  /**
   * Event fired when the stream is disconnected from the backend and no video or no audio is available.
   * @return {string}
   */
  static get STREAM_DISCONNECTED() {
    return 'stream-disconnected';
  }

  /**
   * Event that is fired when the stream enters an unreachable and none recoverable state.
   * @return {string}
   */
  static get STREAM_UNREACHABLE() {
    return 'stream-unreachable';
  }

  /**
   * Event that is fired when the edge node crashes.
   * @return {string}
   */
  static get EDGE_NODE_CRASHED() {
    return 'edge-node-crashed';
  }

  /**
   * Backend signal the stream are in progress to be terminated.
   * @returns {string}
   */
  static get STREAM_TERMINATED() {
    return 'stream-terminated';
  }

  /**
   * Backend signal the stream are paused now.
   * @returns {string}
   */
  static get STREAM_PAUSED() {
    return 'stream-paused';
  }

  /**
   * Backend signal the stream are resumed now.
   * @returns {string}
   */
  static get STREAM_RESUMED() {
    return 'stream-resumed';
  }

  /**
   * Event fired when the stream is reloaded during auto recovery process from an error.
   * @return {string}
   */
  static get STREAM_RELOADED() {
    return 'stream-reloaded';
  }

  /**
   * Event fired when the video stream started playing (resume from paused or started)
   * @return {string}
   */
  static get STREAM_VIDEO_PLAYING() {
    return 'stream-video-playing';
  }

  /**
   * Event fired the event oncanplay is happen on the video DOM element after the tracks has been added.
   * @return {string}
   */
  static get STREAM_VIDEO_CAN_PLAY() {
    return 'stream-video-can-play';
  }

  /**
   * Event fired when the video is available and can be played.
   * @return {string}
   */
  static get STREAM_VIDEO_AVAILABLE() {
    return 'stream-video-available';
  }

  /**
   * Event fired when the video is not longer available.
   * @return {string}
   */
  static get STREAM_VIDEO_UNAVAILABLE() {
    return 'stream-video-unavailable';
  }

  /**
   * Event fired when the video is missing but not certainly unavailable.
   * @return {string}
   */
  static get STREAM_VIDEO_MISSING() {
    return 'stream-video-missing';
  }

  /**
   * Event fired when a user interaction is required in order to start video playing
   * @return {string}
   */
  static get REQUIRE_USER_PLAY_INTERACTION() {
    return 'require-user-play-interaction';
  }

  /**
   * Event fired when a thumbnail screenshot of the video has been created.
   * @returns {string}
   */
  static get STREAM_VIDEO_SCREENSHOT() {
    return 'stream-video-screenshot';
  }

  /**
   * Event fires when a black screen occurs on the user viewport
   * @return {string}
   */
  static get STREAM_BLACK_SCREEN() {
    return 'stream-black-screen';
  }

  /**
   * Event fires on first user interaction with audio codec
   * @return {string}
   */
  static get STREAM_AUDIO_CODEC() {
    return 'stream-audio-codec';
  }

  /**
   * Event fires on first user interaction with video codec
   * @return {string}
   */
  static get STREAM_VIDEO_CODEC() {
    return 'stream-video-codec';
  }

  /**
   * Event fired when the user interact with a running stream.
   * @return {string}
   */
  static get USER_INTERACTION() {
    return 'user-interaction';
  }

  /**
   * Event fired when receiving emulator configuration during initialization of P2P connection
   * @returns {string}
   */
  static get EMULATOR_CONFIGURATION() {
    return 'emulator-configuration';
  }

  /**
   * Event fired when the stream quality rating has been updated.
   * @return {string}
   */
  static get STREAM_QUALITY_RATING() {
    return 'stream-quality-rating';
  }

  /**
   * Event fired when the audio is available and can be un-muted.
   * @return {string}
   */
  static get STREAM_AUDIO_AVAILABLE() {
    return 'stream-audio-available';
  }

  /**
   * Event fired when the audio is not longer available.
   * @return {string}
   */
  static get STREAM_AUDIO_UNAVAILABLE() {
    return 'stream-audio-unavailable';
  }

  /**
   * Event fired when the audio unmute action paused the video
   * @return {string}
   */
  static get STREAM_AUDIO_UNMUTE_ERROR() {
    return 'stream-audio-unmute-error';
  }

  /**
   * Report that should be sent up to the backend from user clicked play until stream video is playing
   * @return {string}
   */
  static get STREAM_LOADING_TIME() {
    return 'stream-loading-time';
  }

  /**
   * Event fired when the webrtc video stream is available and can be played by the browser
   * @return {string}
   */
  static get STREAM_WEBRTC_READY() {
    return 'stream-webrtc-ready';
  }


  /**
   * Event fired when the emulator is ready and first input lag fix has been applied.
   * @return {string}
   */
  static get STREAM_EMULATOR_READY() {
    return 'stream-emulator-ready';
  }

  /**
   * Event fired when the video stream is available and "play" button can be displayed for the end user,
   * this will only happen after both STREAM_WEBRTC_READY and STREAM_EMULATOR_READY has been received.
   * @return {string}
   */
  static get STREAM_READY() {
    return 'stream-ready';
  }

  /**
   * Event fired when User Event Report is submitted
   * @return {string}
   */
  static get USER_EVENT_REPORT() {
    return 'user-event-report';
  }

  /**
   * Event fired when the user starts playing the game
   * @return {string}
   */
  static get USER_STARTS_PLAYING() {
    return 'user-starts-playing';
  }

  /**
   * Custom moment event send by moment event detector to SDK.
   * @return {string}
   */
  static get MOMENT_DETECTOR_EVENT() {
    return 'moment-detector-event';
  }

  /**
   * Event fired many times during a game session after (re)evaluation of the predicted game experience.
   * @return {string}
   */
  static get PREDICTED_GAME_EXPERIENCE() {
    return 'predicted-game-experience';
  }

  /**
   * Event fired when the new edgeWorker is detected by StreamingEvent handler.
   * @return {string}
   */
  static get NEW_EDGE_WORKER() {
    return 'new-edge-worker';
  }

  /**
   * Event fired when the new edge node is detected by StreamingEvent handler.
   * @return {string}
   */
  static get NEW_EDGE_NODE() {
    return 'new-edge-node';
  }

  /**
   * Event fired by StreamingEvent when the edge node has been destroyed.
   * @return {string}
   */
  static get DESTROY_EDGE_NODE() {
    return 'destroy-edge-node';
  }

  /**
   * Event fired at the end of the stream with the collected measurement report
   * @return {string}
   */
  static get CLASSIFICATION_REPORT() {
    return 'classification-report';
  }


  /**
   * Get EventEmitter for a specific Edge Node Id.
   * This will automatically create a new Event emitter if missing.
   * @param {string} edgeNodeId
   * @return {ExtendedEventEmitter}
   */
  static edgeNode(edgeNodeId) {
    if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
      edgeNodeEventEmitter[edgeNodeId] = new ExtendedEventEmitter(edgeNodeId);
      this.emit(StreamingEvent.NEW_EDGE_NODE, edgeNodeId);
    }
    return edgeNodeEventEmitter[edgeNodeId];
  }

  /**
   * Get list of edge nodes.
   * @return {string[]}
   */
  static getEdgeNodes() {
    return Object.keys(edgeNodeEventEmitter);
  }

  /**
   * Destroy all the EventEmitter for a specific edge node and force unsubscribe all listeners
   * that are subscribed for edge node events.
   * @param {string} edgeNodeId
   * @return {EventEmitter}
   */
  static destroyEdgeNode(edgeNodeId) {
    const emitter = edgeNodeEventEmitter[edgeNodeId];
    if (emitter) {
      delete edgeNodeEventEmitter[edgeNodeId];
      emitter.removeAllListeners();
      this.emit(StreamingEvent.DESTROY_EDGE_NODE, edgeNodeId);
    }
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static on(event, callback) {
    globalEventEmitter.on(event, callback);
    return this;
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static once(event, callback) {
    globalEventEmitter.once(event, callback);
    return this;
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static off(event, callback) {
    globalEventEmitter.off(event, callback);
    return this;
  }

  /**
   * Emit an event to the global scope and all edge node scopes.
   * @param {string} event
   * @param {*} data
   */
  static emit(event, data) {
    globalEventEmitter.emit(event, data);
    for (let edgeNodeId in edgeNodeEventEmitter) {
      if (edgeNodeEventEmitter[edgeNodeId]) {
        edgeNodeEventEmitter[edgeNodeId]._emit(event, data);
      }
    }
  }
}
