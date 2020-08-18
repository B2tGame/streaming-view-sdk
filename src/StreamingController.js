import axios from 'axios';
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