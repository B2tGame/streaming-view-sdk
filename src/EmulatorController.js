import PropTypes from 'prop-types';
import axios from 'axios';
export default class EmulatorController {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    edgeNodeId: PropTypes.string.isRequired,
  };
  constructor(props) {
    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId;
  }

  terminate = () => {
    return axios.get( `${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`);
  };
}
