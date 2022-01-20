"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _react = require("react");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _networkConnectivity = require("./stores/networkConnectivity");

var _deviceInfo = require("./stores/deviceInfo");

var _Logger = _interopRequireDefault(require("./Logger"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * StreamingAgent class is responsible for running necessary background tasks for the Streaming Service
 *
 * @class StreamingAgent
 * @extends {Component}
 */
var StreamingAgent = /*#__PURE__*/function (_Component) {
  (0, _inherits2.default)(StreamingAgent, _Component);

  var _super = _createSuper(StreamingAgent);

  function StreamingAgent(props) {
    var _this;

    (0, _classCallCheck2.default)(this, StreamingAgent);
    _this = _super.call(this, props);
    _this.logger = new _Logger.default();
    _this.connection = {};
    return _this;
  }

  (0, _createClass2.default)(StreamingAgent, [{
    key: "logError",
    value: function logError(error) {
      this.logger.error('Streaming Agent', error);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      this.clearStoresCache();
      this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

      this.connection.onchange = function () {
        return _this2.onConnectivityUpdate();
      }; //TODO-Jonathan: pls check if we really need this


      this.onConnectivityUpdate();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.connection.onchange = function () {};

      this.clearStoresCache();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (prevProps.apiEndpoint !== this.props.apiEndpoint) {
        this.onConnectivityUpdate();
      }
    }
  }, {
    key: "clearStoresCache",
    value: function clearStoresCache() {
      (0, _networkConnectivity.resetNetworkConnectivity)();
      (0, _deviceInfo.resetDeviceInfo)();
    }
    /**
     * Trigger all background activity needed for update the connectivity if the agent is not set to internalSession mode.
     * This will also clear any existing data.
     */

  }, {
    key: "onConnectivityUpdate",
    value: function onConnectivityUpdate() {
      var _this3 = this;

      this.clearStoresCache();

      if (!this.props.internalSession && this.props.apiEndpoint) {
        (0, _deviceInfo.getDeviceInfo)(this.props.apiEndpoint, this.connection).then(function () {
          return (0, _networkConnectivity.measureNetworkConnectivity)(_this3.connection);
        }).catch(function (err) {
          return _this3.logError(err);
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      return null;
    }
  }]);
  return StreamingAgent;
}(_react.Component);

exports.default = StreamingAgent;
StreamingAgent.propTypes = {
  apiEndpoint: _propTypes.default.string.isRequired,
  pingInterval: _propTypes.default.number,
  internalSession: _propTypes.default.bool
};