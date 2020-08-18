import PropTypes from 'prop-types';
import rp from 'request-promise';
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
    console.log('emulatorController', this.apiEndpoint, this.edgeNodeId);
    return rp.get({
      uri: `${this.apiEndpoint}/${this.edgeNodeId}/emulator-commands/terminate`,
      json: true,
    });
  };
}
