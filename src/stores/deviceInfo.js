import axios from 'axios';
import { getNetworkConnectivity } from './networkConnectivity';
import Logger from './../Logger';

let deviceInfo = {};
let iceServers = {};

/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */
function requestNetworkDeviceInfo(apiEndpoint) {
  return axios.get(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, { timeout: 2500 }).then((result) => result.data);
}

/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */
function requestIceServers(apiEndpoint) {
  return axios.get(`${apiEndpoint}/api/streaming-games/edge-node/ice-server`, { timeout: 2500 }).then((result) => result.data || {});
}

/**
 *
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{screenWidth: number, screenScale: (number), viewportWidth: number, screenHeight: number, viewportHeight: number, connectionEffectiveType: *, connectionType: *}>}
 */
function getBrowserDeviceInfo(browserConnection = undefined) {
  const connection = browserConnection
    ? browserConnection
    : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
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
  return Object.keys(deviceInfo).length === 0
    ? requestNetworkDeviceInfo(apiEndpoint).then((networkDeviceInfo) => {
        deviceInfo = networkDeviceInfo;
        return networkDeviceInfo;
      })
    : Promise.resolve(deviceInfo);
}

/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */
function getIceServers(apiEndpoint) {
  return Object.keys(iceServers).length === 0
    ? requestIceServers(apiEndpoint).then((iceServerCandidates) => {
        iceServers = { ...iceServerCandidates };
        return iceServers;
      })
    : Promise.resolve(iceServers);
}

/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{}>}
 */
function getDeviceInfo(apiEndpoint, browserConnection = undefined) {
  return Promise.all([
    getNetworkDeviceInfo(apiEndpoint),
    getBrowserDeviceInfo(browserConnection),
    getNetworkConnectivity(browserConnection),
    getIceServers(apiEndpoint)
  ]).then(([networkDeviceInfo, browserDeviceInfo, networkConnectivity, iceServers]) => {
    const deviceInfo = { ...networkDeviceInfo, ...browserDeviceInfo, ...networkConnectivity, iceServers: { ...iceServers } };
    new Logger().info('deviceInfo is ready', deviceInfo);
    return deviceInfo;
  });
}

/**
 * Reset all device information
 */
function resetDeviceInfo() {
  deviceInfo = {};
}

export { getDeviceInfo, resetDeviceInfo };
