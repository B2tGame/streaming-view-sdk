import axios from 'axios';
import { getNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo } from './stores/deviceInfo';
import ConsoleLogger from './ConsoleLogger';

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
   * Event that is fire when the current location/data center has no
   * free allocations for this edge node and result in the edge node is queued until required capacity in the datacenter exists.
   * @returns {string}
   * @constructor
   */
  static get EVENT_SERVER_OUT_OF_CAPACITY() {
    return 'server-out-of-capacity';
  }

  /**
   * Event that is fire when the stream are connected to the backend and the consumer receiving a video stream.
   * @returns {string}
   * @constructor
   */
  static get EVENT_STREAM_CONNECTED() {
    return 'stream-connected';
  }

  /**
   * Event that is fired after receiving emulator configuration during initialization of P2P connection
   * @returns {string}
   * @constructor
   */
  static get EVENT_EMULATOR_CONFIGURATION() {
    return 'emulator-configuration'
  }

  /**
   *
   * @param {object} props
   * @param {string} props.apiEndpoint
   * @param {string} props.edgeNodeId Optional parameters, require for some of the API.
   * @param {callback} props.onEvent Optional parameters, callback function to receiving events from the controller.
   */
  constructor(props) {
    if (!props.apiEndpoint) {
      throw new Error('StreamingController: Missing apiEndpoint');
    }
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
    this.onEvent = props.onEvent || (() => {});
    this.consoleLogger = new ConsoleLogger(props.enableDebug);
  }

  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */
  getEdgeNodeId() {
    return this.edgeNodeId !== undefined
      ? Promise.resolve(this.edgeNodeId)
      : Promise.reject(
          new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.')
        );
  }

  /**
   * Terminate the instance
   * @returns {Promise<*>}
   */
  terminate() {
    return this.getStreamEndpoint().then((streamEndpoint) => {
      return axios.get(`${streamEndpoint}/emulator-commands/terminate`);
    });
  }

  /**
   * Creates a game snapshot
   * @returns {Promise<string>}
   */
  createGameSnapshot() {
    return this.getStreamEndpoint()
      .then((streamEndpoint) => {
        return axios.get(`${streamEndpoint}/emulator-commands/create-snapshot`);
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
   * Get the streaming endpoint
   * @return {Promise<string>}
   */
  getStreamEndpoint() {
    return this.waitFor().then((status) => status.endpoint);
  }

  /**
   * Get API Endpoint
   * @returns {string}
   */
  getApiEndpoint() {
    return this.apiEndpoint;
  }

  /**
   * Wait for the edge node to be ready before the promise will resolve.
   * @param {number} timeout Max duration the waitFor should wait before reject with an timeout exception.
   * @returns {Promise<{status: string, endpoint: string}>}
   */
  waitFor(timeout = StreamingController.DEFAULT_TIMEOUT) {
    let isQueuedEventFire = false;
    /**
     * Get the status of the edge node.
     * @param {string} uri
     * @param {number} timeout
     * @returns {Promise<*>}
     */
    const getStatus = (uri, timeout) => {
      return axios.get(uri, { timeout: timeout }).then((result) => {
        if (result.data.state === 'pending') {
          if (result.data.queued && !isQueuedEventFire) {
            isQueuedEventFire = true;
            this.onEvent(StreamingController.EVENT_SERVER_OUT_OF_CAPACITY);
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
            if (endTimestamp > Date.now()) {
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
      return retry(() => getStatus(`${this.getApiEndpoint()}/api/streaming-games/status/${edgeNodeId}`, 2500), timeout);
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

factory.EVENT_STREAM_CONNECTED = StreamingController.EVENT_STREAM_CONNECTED;
factory.EVENT_SERVER_OUT_OF_CAPACITY = StreamingController.EVENT_SERVER_OUT_OF_CAPACITY;

export default factory;
