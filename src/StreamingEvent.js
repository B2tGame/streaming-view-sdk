import EventEmitter from 'eventemitter3';

class ExtendedEventEmitter extends EventEmitter {
  emit(event, data) {
    super.emit(event, data);
    super.emit('event', event, data);
    return this;
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
   * Event that is fire when the SDK reciving the edge node are ready to accept a connection.
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
   * Event that is fired when the stream crashes.
   * @return {string}
   */
  static get STREAM_CRASHED() {
    return 'stream-crashed';
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
   * Event fired when the audio is available and can be unmuted.
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
   * Report that should be sent up to the backend from user clicked play until stream video is playing
   * @return {string}
   */
  static get STREAM_LOADING_TIME() {
    return 'stream-loading-time';
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
   * Get EventEmitter for a specific Edge Node Id.
   * This will automatic create a new Event emitter if missing.
   * @param {string} edgeNodeId
   * @return {EventEmitter}
   */
  static edgeNode(edgeNodeId) {
    if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
      edgeNodeEventEmitter[edgeNodeId] = new ExtendedEventEmitter();
    }
    return edgeNodeEventEmitter[edgeNodeId];
  }

  /**
   * Destroy all the EventEmitter for a specific edge node and force unsubscribe all listeners
   * that are subscribed for edge node events.
   * @param {string} edgeNodeId
   * @return {EventEmitter}
   */
  static destroyEdgeNode(edgeNodeId) {
    const emitter = edgeNodeEventEmitter[edgeNodeId];
    edgeNodeEventEmitter[edgeNodeId] = undefined;
    if (emitter) {
      emitter.removeAllListeners();
    }
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static on(event, callback) {
    globalEventEmitter.on(event, callback);
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static once(event, callback) {
    globalEventEmitter.once(event, callback);
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  static off(event, callback) {
    globalEventEmitter.off(event, callback);
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
        edgeNodeEventEmitter[edgeNodeId].emit(event, data);
      }
    }
  }
}