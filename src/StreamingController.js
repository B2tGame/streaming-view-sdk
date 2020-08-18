import axios from 'axios';

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
    return axios.get( `${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`);
  };
}

/**
 * Instanciating the StreamingController
 * @returns {Promise<StreamingController>}
 */
export default (props) => {
  return Promise.resolve(new StreamingController(props));
}