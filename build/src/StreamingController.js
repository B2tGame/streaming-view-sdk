"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _url = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/url"));

var _axios = _interopRequireDefault(require("axios"));

var _networkConnectivity = require("./stores/networkConnectivity");

var _deviceInfo = require("./stores/deviceInfo");

var _StreamingEvent = _interopRequireDefault(require("./StreamingEvent"));

var _buildInfo = _interopRequireDefault(require("./build-info.json"));

/**
 * StreamingController is responsible to poll and terminate the edge node.
 *
 * @class StreamingController
 */
class StreamingController {
  static get DEFAULT_TIMEOUT() {
    return 30 * 60 * 1000; // 30 minute
  }
  /**
   * Get SDK Version
   * @returns {string}
   */


  static get SDK_VERSION() {
    return _buildInfo.default.tag;
  }
  /**
   * Wait until the edge node reach a ready state.
   */


  static get WAIT_FOR_READY() {
    return 'ready';
  }
  /**
   * Wait until the edge node receiving an endpoint independent of the ready state.
   */


  static get WAIT_FOR_ENDPOINT() {
    return 'endpoint';
  }
  /**
   *
   * @param {object} props
   * @param {string} props.apiEndpoint
   * @param {string} props.edgeNodeId Optional parameters, require for some of the API.
   * @param {string} props.internalSession Optional parameter for flagging if the session is internal.
   */


  constructor(props) {
    if (!props.apiEndpoint) {
      throw new Error('StreamingController: Missing apiEndpoint');
    }

    try {
      new _url.default(props.apiEndpoint);
    } catch (err) {
      throw new Error("StreamingController: invalid apiEndpoint, got \"".concat(props.apiEndpoint, "\" as input"));
    }

    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
    this.internalSession = props.internalSession || false;
  }
  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */


  getEdgeNodeId() {
    return this.edgeNodeId !== undefined ? Promise.resolve(this.edgeNodeId) : Promise.reject(new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.'));
  }
  /**
   * Terminate the instance
   * @returns {Promise<*>}
   */


  terminate() {
    return this.getStreamEndpoint().then(streamEndpoint => _axios.default.get("".concat(streamEndpoint, "/emulator-commands/terminate")));
  }
  /**
   * Backup the current state
   * @returns {Promise<*>}
   */


  backup() {
    return this.getStreamEndpoint().then(streamEndpoint => {
      return _axios.default.get("".concat(streamEndpoint, "/emulator-commands/backup"));
    }).then(resp => {
      if (resp.data.toString().startsWith('FAIL')) {
        throw new Error(resp.data.toString());
      } else {
        return resp.data;
      }
    });
  }
  /**
   * Creates a game snapshot
   * @returns {Promise<string>}
   */


  createGameSnapshot() {
    return this.save();
  }
  /**
   * Get a list of predicted game experiences for all apps based on the current usage connectivity.
   * @returns {Promise<[{appId: number, score: number}]>}
   */


  getPredictedGameExperiences() {
    return Promise.all([this.getApiEndpoint(), this.getConnectivityInfo()]).then(_ref => {
      let [apiEndpoint, connectivityInfo] = _ref;
      const encodedConnectivityInfo = encodeURIComponent(JSON.stringify(connectivityInfo));
      return Promise.all([connectivityInfo, _axios.default.get("".concat(apiEndpoint, "/api/streaming-games/predicted-game-experience?connectivity-info=").concat(encodedConnectivityInfo))]);
    }).then(_ref2 => {
      let [connectivityInfo, result] = _ref2;
      return {
        apps: (result.data || {}).apps || [],
        measurementLevel: connectivityInfo.measurementLevel
      };
    });
  }
  /**
   * Sends the save command to the supervisor.
   * This is used to trigger different save behaviour depending on edgenode mode.
   * Snapshot mode: saves a snapshot
   * Apk-image mode: saves an apk image
   * Base-image mode: saves a base image definition
   * @returns {Promise<string>}
   */


  save() {
    return this.getStreamEndpoint().then(streamEndpoint => {
      return _axios.default.get("".concat(streamEndpoint, "/emulator-commands/save"));
    }).then(resp => {
      if (resp.data.toString().startsWith('FAIL')) {
        throw new Error(resp.data.toString());
      } else {
        return resp.data;
      }
    });
  }
  /**
   * Sends the pause command to the supervisor.
   * This is used to pause the emulator.
   * @returns {Promise<*>}
   */


  pause() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(_ref3 => {
      let [edgeNodeId, streamEndpoint] = _ref3;

      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.LOG, {
        name: 'streaming-controller',
        action: 'pause'
      });

      return _axios.default.get("".concat(streamEndpoint, "/emulator-commands/pause"));
    });
  }
  /**
   * Resets the current moment.
   * @returns {Promise<*>}
   */


  resetMoment() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(_ref4 => {
      let [edgeNodeId, streamEndpoint] = _ref4;

      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.LOG, {
        name: 'streaming-controller',
        action: 'resetMoment'
      });

      return _axios.default.get("".concat(streamEndpoint, "/emulator-commands/reset")).then(() => {
        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_READY);
      });
    });
  }
  /**
   * Sends the pause command to the supervisor.
   * This is used to resume a paused emulator.
   * @returns {Promise<*>}
   */


  resume() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(_ref5 => {
      let [edgeNodeId, streamEndpoint] = _ref5;

      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.LOG, {
        name: 'streaming-controller',
        action: 'resume'
      });

      return _axios.default.get("".concat(streamEndpoint, "/emulator-commands/resume"));
    });
  }
  /**
   * Get the streaming endpoint
   * @return {Promise<string>}
   */


  getStreamEndpoint() {
    return this.waitFor().then(status => {
      if (status.endpoint !== undefined) {
        return status.endpoint;
      } else {
        throw new Error("Can't resolve Stream Endpoint, got: " + JSON.stringify(status));
      }
    });
  }
  /**
   * Get API Endpoint
   * @returns {string}
   */


  getApiEndpoint() {
    return this.apiEndpoint;
  }
  /**
   * Determine if the session is internal.
   * @return {boolean}
   */


  isInternalSession() {
    return this.internalSession;
  }
  /**
   * Wait for the edge node to be ready before the promise will resolve.
   * @param {StreamingController.WAIT_FOR_READY|StreamingController.WAIT_FOR_ENDPOINT} waitFor Define the exit criteria for what to wait for.
   * @param {number} timeout Max duration the waitFor should wait before reject with an timeout exception.
   * @returns {Promise<{status: string, endpoint: string}>}
   */


  waitFor() {
    let waitFor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : StreamingController.WAIT_FOR_READY;
    let timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : StreamingController.DEFAULT_TIMEOUT;
    let isQueuedEventFire = false;
    /**
     * Get the status of the edge node.
     * @param {string} uri
     * @param {number} timeout
     * @returns {Promise<*>}
     */

    const getStatus = (uri, timeout) => {
      return _axios.default.get(uri, {
        timeout: timeout
      }).then(result => {
        const stillWaiting = waitFor === StreamingController.WAIT_FOR_READY && result.data.state === 'pending' || waitFor === StreamingController.WAIT_FOR_ENDPOINT && result.data.endpoint === undefined;

        if (stillWaiting) {
          if (result.data.queued && !isQueuedEventFire) {
            isQueuedEventFire = true;

            if (this.edgeNodeId) {
              _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.SERVER_OUT_OF_CAPACITY);
            }
          }

          throw new Error('pending');
        } else {
          return result.data;
        }
      });
    };
    /**
     * Retry will try to execute the promise that the callback function returns
     * until resolved or runs out of maxRetry
     * @param {function: Promise<*>} callback
     * @param {number} maxTimeout
     */


    const retry = (callback, maxTimeout) => {
      const endTimestamp = Date.now() + maxTimeout;
      return new Promise((resolve, reject) => {
        const fn = () => {
          callback().then(resolve, err => {
            const httpStatusCode = (err.response || {}).status || 500;

            if (httpStatusCode === 404) {
              resolve((err.response || {}).data || {});
            } else if (endTimestamp > Date.now()) {
              setTimeout(fn, 10);
            } else {
              reject(err);
            }
          });
        };

        fn();
      });
    };

    return this.getEdgeNodeId().then(edgeNodeId => {
      const internalSession = this.isInternalSession() ? '&internal=1' : '';
      return retry(() => getStatus("".concat(this.getApiEndpoint(), "/api/streaming-games/status/").concat(edgeNodeId, "?wait=1").concat(internalSession), 5000), timeout);
    });
  }
  /**
   * Get device info from the device including geolocation, screen configuration etc.
   * @returns {Promise<object>}
   */


  getDeviceInfo() {
    return (0, _deviceInfo.getDeviceInfo)(this.getApiEndpoint());
  }
  /**
   * Get connectivity info
   * @returns {Promise<{}>}
   */


  getConnectivityInfo() {
    return (0, _networkConnectivity.getNetworkConnectivity)();
  }

}
/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */


const factory = props => {
  return Promise.resolve(props).then(props => new StreamingController(props));
};

factory.EVENT_STREAM_CONNECTED = _StreamingEvent.default.STREAM_CONNECTED;
factory.EVENT_SERVER_OUT_OF_CAPACITY = _StreamingEvent.default.SERVER_OUT_OF_CAPACITY;
factory.EVENT_EMULATOR_CONFIGURATION = _StreamingEvent.default.EMULATOR_CONFIGURATION;
factory.EVENT_STREAM_UNREACHABLE = _StreamingEvent.default.STREAM_UNREACHABLE;
factory.EVENT_STREAM_PAUSED = _StreamingEvent.default.STREAM_PAUSED;
factory.EVENT_STREAM_RESUMED = _StreamingEvent.default.STREAM_RESUMED;
factory.EVENT_EDGE_NODE_CRASHED = _StreamingEvent.default.EDGE_NODE_CRASHED;
factory.EVENT_REQUIRE_USER_PLAY_INTERACTION = _StreamingEvent.default.REQUIRE_USER_PLAY_INTERACTION;
factory.SDK_VERSION = StreamingController.SDK_VERSION;
factory.EVENT_STREAM_READY = _StreamingEvent.default.STREAM_READY;
factory.EVENT_MOMENT_DETECTOR_EVENT = _StreamingEvent.default.MOMENT_DETECTOR_EVENT;
factory.EVENT_PREDICTED_GAME_EXPERIENCE = _StreamingEvent.default.PREDICTED_GAME_EXPERIENCE;
factory.EVENT_STREAM_TERMINATED = _StreamingEvent.default.STREAM_TERMINATED;
factory.WAIT_FOR_READY = StreamingController.WAIT_FOR_READY;
factory.WAIT_FOR_ENDPOINT = StreamingController.WAIT_FOR_ENDPOINT;
var _default = factory;
exports.default = _default;