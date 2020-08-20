import axios from 'axios';
import rp from 'request-promise';

/**
 * Streamingcontroller is responsible for controlling the edge node for example terminate it.
 *
 * @class StreamingController
 *
 */
class StreamingController {
  constructor(props) {
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId;
  }
  /**
   * terminate the instance
   * @returns {Promise<*>}
   */
  terminate = () => {
    return axios.get(`${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`);
  };
}

const getStatus = (uri, timeout) => {
  return axios.get(uri, { timeout: timeout }).then((result) => {
    console.log('getStatus', result);
    if (result.data.state === 'pending') {
      throw new Error('pending');
    } else {
      return result.data;
    }
  });
};

const retry = (callback, maxRetry, holdOffTime) => {
  return new Promise((resolve, reject) => {
    const fn = () => {
      callback().then(resolve, (err) => {
        --maxRetry <= 0 ? reject(err) : setTimeout(fn, holdOffTime);
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
  const makeRequest = () => getStatus(`${props.apiEndpoint}/api/streaming-games/status/${props.edgeNodeId}`, 2500);
  return retry(makeRequest, 30, 1000).then((result) => {
    if (result.state === 'ready') {
      return new StreamingController({ apiEndpoint: result.endpoint, edgeNodeId: props.edgeNodeId });
    } else {
      throw new Error('Stream is not ready');
    }
  });
};
