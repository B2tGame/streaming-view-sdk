"use strict";

var _Object$keys2 = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.getDeviceInfo = getDeviceInfo;
exports.getNetworkDeviceInfo = getNetworkDeviceInfo;
exports.resetDeviceInfo = resetDeviceInfo;
exports.updateDeviceInfo = updateDeviceInfo;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _axios = _interopRequireDefault(require("axios"));

var _networkConnectivity = require("./networkConnectivity");

var _Logger = _interopRequireDefault(require("./../Logger"));

var _DeviceInfoService = _interopRequireDefault(require("../service/DeviceInfoService"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys2(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var _context2, _context3; var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? _forEachInstanceProperty(_context2 = ownKeys(Object(source), !0)).call(_context2, function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : _forEachInstanceProperty(_context3 = ownKeys(Object(source))).call(_context3, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

var deviceInfo = {};
var iceServers = {};
var cachedApiEndpoint;
/**
 *
 * @param {string} apiEndpoint
 * @param {string} region
 * @returns {Promise<*>}
 */

function requestIceServers(apiEndpoint, region) {
  var _context;

  return _axios["default"].get((0, _concat["default"])(_context = "".concat(apiEndpoint, "/api/streaming-games/edge-node/ice-server/")).call(_context, region), {
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
  return _promise["default"].resolve({
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
 * @param {string} apiEndpoint
 * @param {{userId: string} | undefined} options
 * @return {Promise<{*}>}
 */


function getNetworkDeviceInfo(apiEndpoint, options) {
  if ((0, _keys["default"])(deviceInfo).length > 0) {
    return _promise["default"].resolve(deviceInfo);
  }

  cachedApiEndpoint = apiEndpoint;
  return _DeviceInfoService["default"].createDeviceInfo(apiEndpoint, options).then(function (networkDeviceInfo) {
    deviceInfo = networkDeviceInfo;
    return networkDeviceInfo;
  });
}
/**
 *
 * @param {string} apiEndpoint
 * @param {string} region
 * @returns {Promise<*>}
 */


function getIceServers(apiEndpoint, region) {
  return (0, _keys["default"])(iceServers).length === 0 ? requestIceServers(apiEndpoint, region).then(function (iceServerCandidates) {
    iceServers = _objectSpread({}, iceServerCandidates);
    return iceServers;
  }) : _promise["default"].resolve(iceServers);
}
/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param {{ browserConnection: NetworkInformation | undefined; userId: string | undefined } | undefined; region: string | undefined } options
 * @returns {Promise<{}>}
 */


function getDeviceInfo(apiEndpoint) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var browserConnection = options.browserConnection,
      userId = options.userId,
      region = options.region;
  return _promise["default"].all([getNetworkDeviceInfo(apiEndpoint, {
    userId: userId
  }), getBrowserDeviceInfo(browserConnection), (0, _networkConnectivity.getNetworkConnectivity)(browserConnection), getIceServers(apiEndpoint, region)]).then(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 4),
        networkDeviceInfo = _ref2[0],
        browserDeviceInfo = _ref2[1],
        networkConnectivity = _ref2[2],
        iceServers = _ref2[3];

    var deviceInfo = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, networkDeviceInfo), browserDeviceInfo), networkConnectivity), {}, {
      iceServers: _objectSpread({}, iceServers)
    });

    new _Logger["default"]().info('deviceInfo is ready', deviceInfo);
    return deviceInfo;
  });
}
/**
 * Update the last created device-info
 * @param {{*}} body
 * @param {string | null} apiEndpoint
 * @returns {Promise<{*}>}
 */


function updateDeviceInfo(apiEndpoint, body) {
  return _DeviceInfoService["default"].updateDeviceInfo(apiEndpoint ? apiEndpoint : cachedApiEndpoint, body);
}
/**
 * Reset all device information
 */


function resetDeviceInfo() {
  deviceInfo = {};
}