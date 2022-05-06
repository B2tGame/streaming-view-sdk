import { Component } from 'react';
import PropTypes from 'prop-types';
import networkConnectivity from './stores/networkConnectivity';
import { getDeviceInfo, updateDeviceInfo } from './stores/deviceInfo';
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
    pingInterval: PropTypes.number,
    internalSession: PropTypes.bool
  };

  // TODO right now we need to use a static property to act as a global so that StreamingController
  // can access it. This is not ideal and we might want to rework this.
  static networkConnectivityMeasurements = null;

  constructor(props) {
    super(props);
    this.logger = new Logger();
  }

  componentDidMount() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    this.connection.onchange = () => this.onConnectivityUpdate();
    this.onConnectivityUpdate();
  }

  componentWillUnmount() {
    this.connection.onchange = () => {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.apiEndpoint !== this.props.apiEndpoint) {
      this.onConnectivityUpdate();
    }
  }

  logError(error) {
    this.logger.error('Streaming Agent', error);
  }

  /**
   * Trigger all background activity needed for update the connectivity if the agent is not set to internalSession mode.
   * This will also clear any existing data.
   */
  onConnectivityUpdate() {
    const { internalSession, apiEndpoint } = this.props;

    if (internalSession || !apiEndpoint) {
      return;
    }

    getDeviceInfo(apiEndpoint, { browserConnection: this.connection })
      .then((deviceInfo) => networkConnectivity.runMeasurements(apiEndpoint, deviceInfo.recommendation))
      .then((measurements) => {
        console.log('networkConnectivityMeasurements', measurements);
        this.constructor.networkConnectivityMeasurements = measurements;
        updateDeviceInfo(apiEndpoint, { rttRegionMeasurements: measurements.rttRegionMeasurements });
      })
      .catch((err) => {
        console.warn(err);
        this.logError(err);
      });
  }

  render() {
    return null;
  }
}
