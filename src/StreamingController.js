import axios from 'axios';

/**
 * Streamingcontroller is responsible for controlling the edge node for example terminate it.
 *
 * @class StreamingController
 *
 */
class StreamingController {
  constructor(props) {
    this.streamEndpoint = props.streamEndpoint;
    this.edgeNodeId = props.edgeNodeId;
  }

  /**
   * terminate the instance
   * @returns {Promise<*>}
   */
  terminate() {
    return axios.get(`${this.streamEndpoint}/emulator-commands/terminate`);
  }

  /**
   * Get the streaming endpoint
   @return {string}
   */
  getStreamEndpoint() {
    return this.streamEndpoint;
  }
}

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
 * @param {function: Promise<*>} callback 
 * @param {number} maxRetry 
 * @param {number} holdOffTime 
 */
const retry = (callback, maxRetry, holdOffTime) => {
  return new Promise((resolve, reject) => {
    const fn = () => {
      callback().then(resolve, (err) => {
        --maxRetry;
        if (maxRetry <= 0) {
          reject(err);
        } else {
          setTimeout(fn, holdOffTime);
        }
      });
    };
    fn();
  });
};

/**
 * Instanciating the StreamingController
 * @returns {Promise<StreamingController>}
 */
export default (props) => {
  window.streamingViewCache = window.streamingViewCache || {};
  const cacheKey = props.apiEndpoint + '=>' + props.edgeNodeId;
  if (window.streamingViewCache[cacheKey] !== undefined) {
    return window.streamingViewCache[cacheKey];
  } else {
    window.streamingViewCache[cacheKey] = retry(
      () => getStatus(`${props.apiEndpoint}/api/streaming-games/status/${props.edgeNodeId}`, 2500),
      props.maxRetryCount || 120,
      1000
    ).then((result) => {
      if (result.state === 'ready') {
        window.streamingViewCache[cacheKey] = result.endpoint;
        return new StreamingController({ streamEndpoint: result.endpoint, edgeNodeId: props.edgeNodeId });
      } else {
        throw new Error('Stream is not ready');
      }
    });
    return window.streamingViewCache[cacheKey];
  }
};
