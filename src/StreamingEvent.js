import EventEmitter from 'eventemitter3';

class ExtendedEventEmitter extends EventEmitter {
  emit(event, data) {
    super.emit(event, data);
    super.emit('event', event, data);
  }
}

const globalEventEmitter = new ExtendedEventEmitter();
const edgeNodeEventEmitter = {};


/**
 * Streamign Event Emitter bus for sending and receiving event cross the SDK.
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
   * Web RTC measurement with payload create from {RTCPeerConnection.getStats}
   * @return {string}
   */
  static get WEB_RTC_MEASUREMENT() {
    return 'web-rtc-measurement';
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
   * Event that is fire when the current location/data center has no
   * free allocations for this edge node and result in the edge node is queued until required capacity in the datacenter exists.
   * @returns {string}
   */
  static get SERVER_OUT_OF_CAPACITY() {
    return 'server-out-of-capacity';
  }

  /**
   * Event that is fire when the stream are connected to the backend and the consumer receiving a video stream.
   * @returns {string}
   */
  static get STREAM_CONNECTED() {
    return 'stream-connected';
  }

  /**
   * Event that is fire when the stream are disconnected to the backend and no video or audio may be available.
   * @return {string}
   */
  static get STREAM_DISCONNECTED() {
    return 'stream-disconnected';
  }


  /**
   * Event that is fire when the video stream is starting playing (resume from paused or starting)
   * @return {string}
   */
  static get STREAM_VIDEO_PLAYING() {
    return 'stream-video-playing';
  }

  /**
   * Event fire when the video is available and can be played.
   * @return {string}
   */
  static get STREAM_VIDEO_AVAILABLE() {
    return 'stream-video-available';
  }

  /**
   * Event fire when the video is not longer available.
   * @return {string}
   */
  static get STREAM_VIDEO_UNAVAILABLE() {
    return 'stream-video-unavailable';
  }


  /**
   * Event that is fire when the user interact with a running stream.
   * @return {string}
   */
  static get USER_INTERACTION() {
    return 'user-interaction';
  }

  /**
   * Event that is fired after receiving emulator configuration during initialization of P2P connection
   * @returns {string}
   */
  static get EMULATOR_CONFIGURATION() {
    return 'emulator-configuration';
  }


  /**
   * Event that is fired when the stream quality rating has been updated.
   * @return {string}
   */
  static get STREAM_QUALITY_RATING() {
    return 'stream-quality-rating';
  }

  /**
   * Event fire when the audio is available and can be unmuted.
   * @return {string}
   */
  static get STREAM_AUDIO_AVAILABLE() {
    return 'stream-audio-available';
  }


  /**
   * Event fire when the audio is not longer available.
   * @return {string}
   */
  static get STREAM_AUDIO_UNAVAILABLE() {
    return 'stream-audio-unavailable';
  }

  /**
   *
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
   *
   * @param {string} edgeNodeId
   * @return {EventEmitter}
   */
  static destroyEdgeNode(edgeNodeId) {
    const e = edgeNodeEventEmitter[edgeNodeId];
    edgeNodeEventEmitter[edgeNodeId] = undefined;
    if (e) {
      e.removeAllListeners();
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
   * Emit a event to the global scope and all edge node scopes.
   * @param {string} event
   * @param {*} data
   */
  static emit(event, data) {
    globalEventEmitter.emit(event, data);
    for (let edgeNodeId in edgeNodeEventEmitter) {
      edgeNodeEventEmitter[edgeNodeId].emit(event, data);
    }
  }
}