"use strict";

var _Object$keys2 = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.getDeviceInfo = getDeviceInfo;
exports.resetDeviceInfo = resetDeviceInfo;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _axios = _interopRequireDefault(require("axios"));

var _networkConnectivity = require("./networkConnectivity");

var _Logger = _interopRequireDefault(require("./../Logger"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys2(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

var deviceInfo = {};
var iceServers = {};
/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */

function requestNetworkDeviceInfo(apiEndpoint) {
  return _axios.default.get("".concat(apiEndpoint, "/api/streaming-games/edge-node/device-info"), {
    timeout: 2500
  }).then(function (result) {
    return result.data;
  });
}
/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */


function requestIceServers(apiEndpoint) {
  return _axios.default.get("".concat(apiEndpoint, "/api/streaming-games/edge-node/ice-server"), {
    timeout: 2500
  }).then(function (result) {
    return result.data || {};
  });
}
/**
 *
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{screenWidth: number, screenScale: (number), viewportWidth: number, screenHeight: number, viewportHeight: number, connectionEffectiveType: *, connectionType: *}>}
 */


function getBrowserDeviceInfo() {
  var browserConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
  var connection = browserConnection ? browserConnection : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  var DPI = window.devicePixelRatio || 1;
  return _promise.default.resolve({
    screenScale: DPI,
    screenWidth: Math.round(DPI * window.screen.width),
    screenHeight: Math.round(DPI * window.screen.height),
    viewportWidth: Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
    viewportHeight: Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)),
    connectionType: connection.type,
    connectionEffectiveType: connection.effectiveType
  });
}
/**
 *
 * @param apiEndpoint
 * @return {Promise<*>|Promise<{}>}
 */


function getNetworkDeviceInfo(apiEndpoint) {
  return (0, _keys.default)(deviceInfo).length === 0 ? requestNetworkDeviceInfo(apiEndpoint).then(function (networkDeviceInfo) {
    deviceInfo = networkDeviceInfo;
    return networkDeviceInfo;
  }) : _promise.default.resolve(deviceInfo);
}
/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */


function getIceServers(apiEndpoint) {
  return (0, _keys.default)(iceServers).length === 0 ? requestIceServers(apiEndpoint).then(function (iceServerCandidates) {
    iceServers = _objectSpread({}, iceServerCandidates);
    return iceServers;
  }) : _promise.default.resolve(iceServers);
}
/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{}>}
 */


function getDeviceInfo(apiEndpoint) {
  var browserConnection = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  return _promise.default.all([getNetworkDeviceInfo(apiEndpoint), getBrowserDeviceInfo(browserConnection), (0, _networkConnectivity.getNetworkConnectivity)(browserConnection), getIceServers(apiEndpoint)]).then(function (_ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 4),
        networkDeviceInfo = _ref2[0],
        browserDeviceInfo = _ref2[1],
        networkConnectivity = _ref2[2],
        iceServers = _ref2[3];

    var deviceInfo = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, networkDeviceInfo), browserDeviceInfo), networkConnectivity), {}, {
      iceServers: _objectSpread({}, iceServers)
    });

    new _Logger.default().info('deviceInfo is ready', deviceInfo);
    return deviceInfo;
  });
}
/**
 * Reset all device information
 */


function resetDeviceInfo() {
  deviceInfo = {};
}