import { Component } from 'react';
import PropTypes from 'prop-types';
import { measureNetworkConnectivity, resetNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo, resetDeviceInfo } from './stores/deviceInfo';
import Logger from './Logger';

/**
 * StreamingAgent class is responsible for running necessary background tasks for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
export default class StreamingAgent extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    enableDebug: PropTypes.bool,
    internalSession: PropTypes.bool
  };

  static get DELAY_DEVICE_INFO_MS() {
    return 3000;
  }

  constructor(props) {
    super(props);
    this.logger = new Logger(this.props.enableDebug);
    this.connection = {};
  }

  logError(error) {
    this.logger.error('Streaming Agent', error);
  }

  componentDidMount() {
    this.clearStoresCache();
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    this.connection.onchange = () => this.onConnectivityUpdate();
    this.onConnectivityUpdate();
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
    this.clearStoresCache();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.apiEndpoint !== this.props.apiEndpoint) {
      this.onConnectivityUpdate();
    }
  }

  clearStoresCache() {
    resetNetworkConnectivity();
    resetDeviceInfo();
  }

  /**
   * Trigger all background activity needed for update the connectivity if the agent is not set to internalSession mode.
   * This will also clear any existing data.
   */
  onConnectivityUpdate() {
    this.clearStoresCache();
    if (!this.props.internalSession && this.props.apiEndpoint) {
      setTimeout(() => {
        getDeviceInfo(this.props.apiEndpoint, this.connection)
          .then(() => measureNetworkConnectivity(this.connection))
          .then(console.log)
          .catch((err) => this.logError(err));
      }, StreamingAgent.DELAY_DEVICE_INFO_MS); // delay the execution
    }
  }

  render() {
    return null;
  }
}
