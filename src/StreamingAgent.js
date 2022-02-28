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
    region: PropTypes.string.isRequired,
    pingInterval: PropTypes.number,
    internalSession: PropTypes.bool,
    measureWebrtcRtt: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.logger = new Logger();
    this.connection = {};
    this.measureWebrtcRtt = this.props.measureWebrtcRtt;
  }

  logError(error) {
    this.logger.error('Streaming Agent', error);
  }

  componentDidMount() {
    this.clearStoresCache();
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    this.connection.onchange = () => this.onConnectivityUpdate();
    //TODO-Jonathan: pls check if we really need this
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
    const { internalSession, apiEndpoint, region } = this.props;
    this.clearStoresCache();
    if (!internalSession && apiEndpoint) {
      getDeviceInfo(apiEndpoint, { browserConnection: this.connection, region })
        .then(() => measureNetworkConnectivity(this.connection, this.measureWebrtcRtt))
        .catch((err) => this.logError(err));
    }
  }

  render() {
    return null;
  }
}
