import axios from 'axios';
import { getNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo } from './stores/deviceInfo';
import StreamingEvent from './StreamingEvent';
import buildInfo from './build-info.json';

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
    return buildInfo.tag;
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
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
    this.internalSession = props.internalSession || false;
  }

  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */
  getEdgeNodeId() {
    return this.edgeNodeId !== undefined
      ? Promise.resolve(this.edgeNodeId)
      : Promise.reject(new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.'));
  }

  /**
   * Terminate the instance
   * @returns {Promise<*>}
   */
  terminate() {
    return this.getStreamEndpoint().then((streamEndpoint) => axios.get(`${streamEndpoint}/emulator-commands/terminate`));
  }

  /**
   * Backup the current state
   * @returns {Promise<*>}
   */
  backup() {
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/backup`);
      })
      .then((resp) => {
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
    return Promise.all([this.getApiEndpoint(), this.getConnectivityInfo()])
      .then(([apiEndpoint, connectivityInfo]) => {
        const encodedConnectivityInfo = encodeURIComponent(JSON.stringify(connectivityInfo));
        return axios.get(`${apiEndpoint}/api/streaming-games/predicted-game-experience?connectivity-info=${encodedConnectivityInfo}`);
      })
      .then((result) => (result.data || {}).apps || []);
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
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/save`);
      })
      .then((resp) => {
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
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, { name: 'streaming-controller', action: 'pause' });
      return axios.get(`${streamEndpoint}/emulator-commands/pause`);
    });
  }

  /**
   * Resets the current moment.
   * @returns {Promise<*>}
   */
  resetMoment() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, {
        name: 'streaming-controller',
        action: 'resetMoment'
      });
      return axios.get(`${streamEndpoint}/emulator-commands/reset`);
    });
  }

  /**
   * Sends the pause command to the supervisor.
   * This is used to resume a paused emulator.
   * @returns {Promise<*>}
   */
  resume() {
    return Promise.all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(([edgeNodeId, streamEndpoint]) => {
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.LOG, { name: 'streaming-controller', action: 'resume' });
      return axios.get(`${streamEndpoint}/emulator-commands/resume`);
    });
  }

  /**
   * Get the streaming endpoint
   * @return {Promise<string>}
   */
  getStreamEndpoint() {
    return this.waitFor().then((status) => {
      if (status.endpoint !== undefined) {
        return status.endpoint;
      } else {
        throw new Error('Can\'t resolve Stream Endpoint, got: ' + JSON.stringify(status));
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
   * @param {StreamingController.WAIT_FOR_READY|StreamingController.WAIT_FOR_ENDPOINT} waitUntil Define the end crederia for what to wait for.
   * @param {number} timeout Max duration the waitFor should wait before reject with an timeout exception.
   * @returns {Promise<{status: string, endpoint: string}>}
   */
  waitFor(waitUntil = StreamingController.WAIT_FOR_READY, timeout = StreamingController.DEFAULT_TIMEOUT) {
    let isQueuedEventFire = false;
    /**
     * Get the status of the edge node.
     * @param {string} uri
     * @param {number} timeout
     * @returns {Promise<*>}
     */
    const getStatus = (uri, timeout) => {
      return axios.get(uri, { timeout: timeout }).then((result) => {
        const stillWaiting = (waitUntil === StreamingController.WAIT_FOR_READY && result.data.state === 'pending') || (waitUntil === StreamingController.WAIT_FOR_ENDPOINT && result.data.endpoint === undefined);
        console.log("getStatus", waitUntil, stillWaiting, result.data);
        if (stillWaiting) {
          if (result.data.queued && !isQueuedEventFire) {
            isQueuedEventFire = true;
            if (this.edgeNodeId) {
              StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.SERVER_OUT_OF_CAPACITY);
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
          callback().then(resolve, (err) => {
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

    return this.getEdgeNodeId().then((edgeNodeId) => {
      const internalSession = this.isInternalSession() ? '&internal=1' : '';
      return retry(
        () => getStatus(`${this.getApiEndpoint()}/api/streaming-games/status/${edgeNodeId}?wait=1${internalSession}`, 5000),
        timeout
      );
    });
  }

  /**
   * Get device info from the device including geolocation, screen configuration etc.
   * @returns {Promise<object>}
   */
  getDeviceInfo() {
    return getDeviceInfo(this.getApiEndpoint());
  }

  /**
   * Get connectivity info
   * @returns {Promise<{}>}
   */
  getConnectivityInfo() {
    return getNetworkConnectivity();
  }
}

/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */

const factory = (props) => {
  return Promise.resolve(props).then((props) => new StreamingController(props));
};

factory.EVENT_STREAM_CONNECTED = StreamingEvent.STREAM_CONNECTED;
factory.EVENT_SERVER_OUT_OF_CAPACITY = StreamingEvent.SERVER_OUT_OF_CAPACITY;
factory.EVENT_EMULATOR_CONFIGURATION = StreamingEvent.EMULATOR_CONFIGURATION;
factory.EVENT_STREAM_UNREACHABLE = StreamingEvent.STREAM_UNREACHABLE;
factory.EVENT_STREAM_PAUSED = StreamingEvent.STREAM_PAUSED;
factory.EVENT_STREAM_RESUMED = StreamingEvent.STREAM_RESUMED;
factory.EVENT_EDGE_NODE_CRASHED = StreamingEvent.EDGE_NODE_CRASHED;
factory.EVENT_REQUIRE_USER_PLAY_INTERACTION = StreamingEvent.REQUIRE_USER_PLAY_INTERACTION;
factory.SDK_VERSION = StreamingController.SDK_VERSION;
factory.EVENT_STREAM_READY = StreamingEvent.STREAM_READY;
factory.EVENT_MOMENT_DETECTOR_EVENT = StreamingEvent.MOMENT_DETECTOR_EVENT;
factory.EVENT_PREDICTED_GAME_EXPERIENCE = StreamingEvent.PREDICTED_GAME_EXPERIENCE;
factory.EVENT_STREAM_TERMINATED = StreamingEvent.STREAM_TERMINATED;
factory.WAIT_FOR_READY = StreamingController.WAIT_FOR_READY;
factory.WAIT_FOR_ENDPOINT = StreamingController.WAIT_FOR_ENDPOINT;

export default factory;
