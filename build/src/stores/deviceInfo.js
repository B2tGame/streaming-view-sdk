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
exports.getNetworkDeviceInfo = getNetworkDeviceInfo;
exports.resetDeviceInfo = resetDeviceInfo;
exports.updateDeviceInfo = updateDeviceInfo;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _Logger = _interopRequireDefault(require("./../Logger"));

var _DeviceInfoService = _interopRequireDefault(require("../service/DeviceInfoService"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys2(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

var deviceInfo = {};
var cachedApiEndpoint;
/**
 * @param {string} apiEndpoint
 * @return {Promise<{*}>}
 */

function getNetworkDeviceInfo(apiEndpoint) {
  if ((0, _keys.default)(deviceInfo).length > 0) {
    return _promise.default.resolve(deviceInfo);
  }

  cachedApiEndpoint = apiEndpoint;
  return _DeviceInfoService.default.createDeviceInfo(apiEndpoint).then(function (networkDeviceInfo) {
    deviceInfo = networkDeviceInfo;
    return networkDeviceInfo;
  });
}
/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @returns {Promise<{}>}
 */


function getDeviceInfo(apiEndpoint) {
  var DPI = window.devicePixelRatio || 1;
  var browserDeviceInfo = {
    screenScale: DPI,
    screenWidth: Math.round(DPI * window.screen.width),
    screenHeight: Math.round(DPI * window.screen.height),
    viewportWidth: Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
    viewportHeight: Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0))
  }; // this is using the deviceInfo global as cache

  return getNetworkDeviceInfo(apiEndpoint, {}).then(function (networkDeviceInfo) {
    var deviceInfo = _objectSpread(_objectSpread({}, networkDeviceInfo), browserDeviceInfo);

    new _Logger.default().info('deviceInfo is ready', deviceInfo);
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
  return _DeviceInfoService.default.updateDeviceInfo(apiEndpoint ? apiEndpoint : cachedApiEndpoint, body);
}
/**
 * Reset all device information
 */


function resetDeviceInfo() {
  deviceInfo = {};
}