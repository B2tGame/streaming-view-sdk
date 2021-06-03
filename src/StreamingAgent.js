import { Component } from 'react';
import PropTypes from 'prop-types';
import { measureNetworkConnectivity, resetNetworkConnectivity } from './stores/networkConnectivity';
import { getDeviceInfo, resetDeviceInfo } from './stores/deviceInfo';
// import StreamWebRtc from './service/StreamWebRtc';
import Logger from './Logger';

//TODO: add webrtc measurements also here. (without edge-node-id)
// use device info to get host
// multi connection from different clients

/**
 * StreamingAgent class is responsible for running necessary background tasks for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
export default class StreamingAgent extends Component {
  static propTypes = {
    apiEndpoint: PropTypes.string.isRequired,
    pingInterval: PropTypes.number,
    enableDebug: PropTypes.bool,
    internalSession: PropTypes.bool
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
    // this.streamWebRtc = new StreamWebRtc(undefined, this.props.pingInterval);
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
    this.clearStoresCache();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.apiEndpoint !== this.props.apiEndpoint) {
      this.onConnectivityUpdate();
    }
    // if (this.streamWebRtc) {
    //   this.streamWebRtc.close();
    // }
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
      getDeviceInfo(this.props.apiEndpoint, this.connection)
        .then(() => measureNetworkConnectivity(this.connection))
        .catch((err) => this.logError(err));
    }
  }

  render() {
    return null;
  }
}
