import axios from 'axios';

/**
 * StreamingController is responsible to poll and terminate the edge node.
 *
 * @class StreamingController
 */
class StreamingController {

  static get DEFAULT_TIMEOUT() {
    return 60 * 1000; // 1 minute
  }

  /**
   *
   * @param {object} props
   * @param {string} props.apiEndpoint
   * @param {string} props.edgeNodeId Optional parameters, require for some of the API.
   */
  constructor(props) {
    if (!props.apiEndpoint) {
      throw new Error('StreamingController: Missing apiEndpoint');
    }
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
  }

  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */
  getEdgeNodeId() {
    return this.edgeNodeId !== undefined ?
      Promise.resolve(this.edgeNodeId) :
      Promise.reject(new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.'));
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
    /**
     * Get the status of the edge node.
     * @param {string} uri
     * @param {number} timeout
     * @returns {Promise<*>}
     */
    const getStatus = (uri, timeout) => {
      return axios.get(uri, { timeout: timeout }).then((result) => {
        if (result.data.state === 'pending') {
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
              setTimeout(fn, 500);
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
    return axios.get(`${this.getApiEndpoint()}/api/streaming-games/edge-node/device-info`, { timeout: 2500 })
      .then((result) => result.data || {})
      .then((deviceInfo) => {
        const DPI = window.devicePixelRatio || 1;
        deviceInfo.sreenScale = DPI;
        deviceInfo.screenWidth = Math.round(DPI * window.screen.width);
        deviceInfo.screenHeight = Math.round(DPI * window.screen.height);
        deviceInfo.viewportWidth = Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
        deviceInfo.viewportHeight = Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0));
        return deviceInfo;
      });
  }

}


/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */
export default (props) => {
  return Promise.resolve(props).then((props) => new StreamingController(props));
}