import axios from 'axios';

/**
 * Streamingcontroller is responsible for controlling the edge node for example terminate it.
 *
 * @class StreamingController
 */

class StreamingController {
  constructor(props) {
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId;
  }

  terminate = () => {
    return axios.get( `${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`);
  };
}


export default (props) => {
  return Promise.resolve(new StreamingController(props));
}