"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDeviceInfo = getDeviceInfo;
exports.resetDeviceInfo = resetDeviceInfo;

var _axios = _interopRequireDefault(require("axios"));

var _networkConnectivity = require("./networkConnectivity");

let deviceInfo = {};
/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */

function requestNetworkDeviceInfo(apiEndpoint) {
  return _axios.default.get("".concat(apiEndpoint, "/api/streaming-games/edge-node/device-info"), {
    timeout: 2500
  }).then(result => result.data);
}
/**
 *
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{screenWidth: number, screenScale: (number), viewportWidth: number, screenHeight: number, viewportHeight: number, connectionEffectiveType: *, connectionType: *}>}
 */


function getBrowserDeviceInfo() {
  let browserConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
  const connection = browserConnection ? browserConnection : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  const DPI = window.devicePixelRatio || 1;
  return Promise.resolve({
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
  return Object.keys(deviceInfo).length === 0 ? requestNetworkDeviceInfo(apiEndpoint).then(networkDeviceInfo => {
    deviceInfo = networkDeviceInfo;
    return networkDeviceInfo;
  }) : Promise.resolve(deviceInfo);
}
/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{}>}
 */


function getDeviceInfo(apiEndpoint) {
  let browserConnection = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  return Promise.all([getNetworkDeviceInfo(apiEndpoint), getBrowserDeviceInfo(browserConnection), (0, _networkConnectivity.getNetworkConnectivity)(browserConnection)]).then(_ref => {
    let [networkDeviceInfo, browserDeviceInfo, networkConnectivity] = _ref;
    return { ...networkDeviceInfo,
      ...browserDeviceInfo,
      ...networkConnectivity
    };
  });
}
/**
 * Reset all device information
 */


function resetDeviceInfo() {
  deviceInfo = {};
}