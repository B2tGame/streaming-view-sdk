import EventEmitter from 'eventemitter3';

const globalEventEmitter = new EventEmitter();
const edgeNodeEventEmitter = {};

export default class StreamingEvent {

  /**
   * Event of log with payload {type: string, data: []*}
   * @return {string}
   */
  static get LOG() {
    return 'log';
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