import { Component } from 'react';
import PropTypes from 'prop-types';
import { getNetworkConnectivity, resetNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo, resetDeviceInfo } from './stores/deviceInfo';
import Logger from './Logger';

/**
 * StreamingAgent class is responsible to running any nesureary background task for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
export default class StreamingAgent extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    enableDebug: PropTypes.bool,
    internalSession: PropTypes.bool,
  };

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
    this.connection.onchange = () => {
    };
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
    if (!this.props.internalSession) {
      getNetworkConnectivity(this.connection).catch((err) => this.logError(err));
      getDeviceInfo(this.props.apiEndpoint, this.connection).catch((err) => this.logError(err));
    }
  }

  render() {
    return null;
  }
}
