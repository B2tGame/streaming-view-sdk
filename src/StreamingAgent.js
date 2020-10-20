import { Component } from 'react';
import PropTypes from 'prop-types';
import { getNetworkConnectivity, resetNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo, resetDeviceInfo } from './stores/deviceInfo';
import ConsoleLogger from './ConsoleLogger';

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

  constructor(props) {
    super(props);

    this.consoleLogger = new ConsoleLogger(this.props.enableDebug);
    this.connection = {};
  }

  logError = (error) => {
    this.consoleLogger.log('Streaming Agent error:', error);
  };

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
