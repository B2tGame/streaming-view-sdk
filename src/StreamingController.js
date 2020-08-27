import axios from 'axios';

/**
 * StreamingController is responsible to poll and terminate the edge node.
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
   * Terminate the instance
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
 * Retry will try to execute the promise that the callback function returns
 * untill resolved or runs out of maxRetry
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
 *
 * @param props
 * @returns {{edgeNodeId}|{apiEndpoint}|*}
 */
const validateProperties = (props) => {
  if (!props.apiEndpoint) {
    throw new Error('Missing apiEndpoint');
  }

  if (!props.edgeNodeId) {
    throw new Error('Missing edgeNodeId');
  }

  return props;
};

/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */
export default (props) => {
  return Promise.resolve(props)
    .then((props) => validateProperties(props))
    .then((props) => {
      //TODO: remove cache
      window.streamingViewCache = window.streamingViewCache || {};
      const cacheKey = props.apiEndpoint + '=>' + props.edgeNodeId;
      if (window.streamingViewCache[cacheKey] !== undefined) {
        return window.streamingViewCache[cacheKey];
      } else {
        return (window.streamingViewCache[cacheKey] = retry(
          () => getStatus(`${props.apiEndpoint}/api/streaming-games/status/${props.edgeNodeId}`, 2500),
          props.maxRetryCount || 120,
          1000
        ).then((result) => {
          if (result.state === 'ready') {
            window.streamingViewCache[cacheKey] = new StreamingController({
              streamEndpoint: result.endpoint,
              edgeNodeId: props.edgeNodeId,
            });
            return window.streamingViewCache[cacheKey];
          } else {
            throw new Error('Stream is not ready');
          }
        }));
      }
    });
};
