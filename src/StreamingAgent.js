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
      this.clearStoresCache();

      getNetworkConnectivity(this.connection).catch((error) => {
        console.log('Streaming Agent error: ', error);
      });
      getDeviceInfo(this.props.apiEndpoint, this.connection).catch((error) => {
        console.log('Streaming Agent error: ', error);
      });
    };

    getNetworkConnectivity(this.connection).catch((error) => {
      console.log('Streaming Agent error: ', error);
    });
    getDeviceInfo(this.props.apiEndpoint, this.connection).catch((error) => {
      console.log('Streaming Agent error: ', error);
    });
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
    this.clearStoresCache();
  }

  componentDidUpdate() {
    this.clearStoresCache();

    getNetworkConnectivity(this.connection).catch((error) => {
      console.log('Streaming Agent error: ', error);
    });
    getDeviceInfo(this.props.apiEndpoint, this.connection).catch((error) => {
      console.log('Streaming Agent error: ', error);
    });
  }

  clearStoresCache() {
    resetNetworkConnectivity();
    resetDeviceInfo();
  }

  render() {
    return null;
  }
}
