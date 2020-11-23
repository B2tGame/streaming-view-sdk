import EventEmitter from 'eventemitter3';

const globalEventEmitter = new EventEmitter();
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
   * Event that is fired after receiving emulator configuration during initialization of P2P connection
   * @returns {string}
   */
  static get EMULATOR_CONFIGURATION() {
    return 'emulator-configuration';
  }

  /**
   *
   * @param {string} edgeNodeId
   * @return {EventEmitter}
   */
  static edgeNode(edgeNodeId) {
    if (edgeNodeEventEmitter[edgeNodeId] === undefined) {
      edgeNodeEventEmitter[edgeNodeId] = new EventEmitter();
    }
    return edgeNodeEventEmitter[edgeNodeId];
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  on(event, callback) {
    globalEventEmitter.on(event, callback);
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  once(event, callback) {
    globalEventEmitter.once(event, callback);
  }

  /**
   *
   * @param {string} event
   * @param {function} callback
   */
  off(event, callback) {
    globalEventEmitter.off(event, callback);
  }

  /**
   * Emit a event to the global scope and all edge node scopes.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    globalEventEmitter.emit(event, data);
    for (let emitter of edgeNodeEventEmitter) {
      emitter.emit(event, data);
    }
  }
}