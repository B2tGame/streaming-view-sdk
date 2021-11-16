"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = require("react");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _networkConnectivity = require("./stores/networkConnectivity");

var _deviceInfo = require("./stores/deviceInfo");

var _Logger = _interopRequireDefault(require("./Logger"));

/**
 * StreamingAgent class is responsible for running necessary background tasks for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
class StreamingAgent extends _react.Component {
  constructor(props) {
    super(props);
    this.logger = new _Logger.default();
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
    (0, _networkConnectivity.resetNetworkConnectivity)();
    (0, _deviceInfo.resetDeviceInfo)();
  }
  /**
   * Trigger all background activity needed for update the connectivity if the agent is not set to internalSession mode.
   * This will also clear any existing data.
   */


  onConnectivityUpdate() {
    this.clearStoresCache();

    if (!this.props.internalSession && this.props.apiEndpoint) {
      (0, _deviceInfo.getDeviceInfo)(this.props.apiEndpoint, this.connection).then(() => (0, _networkConnectivity.measureNetworkConnectivity)(this.connection)).catch(err => this.logError(err));
    }
  }

  render() {
    return null;
  }

}

exports.default = StreamingAgent;
StreamingAgent.propTypes = {
  apiEndpoint: _propTypes.default.string.isRequired,
  pingInterval: _propTypes.default.number,
  internalSession: _propTypes.default.bool
};