import { Component } from 'react';
import PropTypes from 'prop-types';
import { getNetworkConnectivity, resetNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo, resetDeviceInfo } from './stores/deviceInfo';

/**
 * StreamingAgent class is responsible to running any nesureary background task for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
export default class StreamingAgent extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.connection = {};
  }

  componentDidMount() {
    this.clearStoresCache();

    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    this.connection.onchange = () => {
      getNetworkConnectivity(this.connection);
      getDeviceInfo(this.props.apiEndpoint, this.connection);
    };

    getNetworkConnectivity(this.connection).then(() => {});
    getDeviceInfo(this.props.apiEndpoint, this.connection).then(() => {});
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
    this.clearStoresCache();
  }

  componentDidUpdate() {
    this.clearStoresCache();

    getNetworkConnectivity(this.connection).then(() => {});
    getDeviceInfo(this.props.apiEndpoint, this.connection).then(() => {});
  }

  clearStoresCache() {
    resetNetworkConnectivity();
    resetDeviceInfo();
  }

  render() {
    return null;
  }
}
