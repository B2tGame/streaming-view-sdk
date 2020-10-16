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
  };

  logError(error) {
    const logger = new Logger(this.props.enableDebug);
    logger.log('Streaming Agent error:', error);
  }

  constructor(props) {
    super(props);

    this.connection = {};
  }

  componentDidMount() {
    this.clearStoresCache();

    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    this.connection.onchange = () => {
      this.clearStoresCache();

      getNetworkConnectivity(this.connection).catch(this.logError);
      getDeviceInfo(this.props.apiEndpoint, this.connection).catch(this.logError);
    };

    getNetworkConnectivity(this.connection).catch(this.logError);
    getDeviceInfo(this.props.apiEndpoint, this.connection).catch(this.logError);
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
    this.clearStoresCache();
  }

  componentDidUpdate() {
    this.clearStoresCache();

    getNetworkConnectivity(this.connection).catch(this.logError);
    getDeviceInfo(this.props.apiEndpoint, this.connection).catch(this.logError);
  }

  clearStoresCache() {
    resetNetworkConnectivity();
    resetDeviceInfo();
  }

  render() {
    return null;
  }
}
