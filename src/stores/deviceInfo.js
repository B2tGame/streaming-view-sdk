import axios from 'axios';
import { getNetworkConnectivity } from './networkConnectivity';
import Logger from './../Logger';
import DeviceInfoService from '../service/DeviceInfoService';

let deviceInfo = {};
let iceServers = {};
let cachedApiEndpoint;

/**
 *
 * @param {string} apiEndpoint
 * @param {string} region
 * @returns {Promise<*>}
 */
function requestIceServers(apiEndpoint, region) {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/ice-server/${region}`, { timeout: 2500 })
    .then((result) => result.data || {});
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
 * @param {string} apiEndpoint
 * @param {{userId: string} | undefined} options
 * @return {Promise<{*}>}
 */
function getNetworkDeviceInfo(apiEndpoint, options) {
  if (Object.keys(deviceInfo).length > 0) {
    return Promise.resolve(deviceInfo);
  }

  cachedApiEndpoint = apiEndpoint;

  return DeviceInfoService.createDeviceInfo(apiEndpoint, options).then((networkDeviceInfo) => {
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
  return Object.keys(iceServers).length === 0
    ? requestIceServers(apiEndpoint, region).then((iceServerCandidates) => {
        iceServers = { ...iceServerCandidates };
        return iceServers;
      })
    : Promise.resolve(iceServers);
}

/**
 * Get device info, network device info is cached and browser/network connectivity information are fetched every time
 * @param {string} apiEndpoint
 * @param {{ browserConnection: NetworkInformation | undefined; userId: string | undefined } | undefined; region: string | undefined } options
 * @returns {Promise<{}>}
 */
function getDeviceInfo(apiEndpoint, options = {}) {
  const { browserConnection, userId, region } = options;
  return Promise.all([
    getNetworkDeviceInfo(apiEndpoint, { userId }),
    getBrowserDeviceInfo(browserConnection),
    getNetworkConnectivity(browserConnection),
    getIceServers(apiEndpoint, region)
  ]).then(([networkDeviceInfo, browserDeviceInfo, networkConnectivity, iceServers]) => {
    const deviceInfo = { ...networkDeviceInfo, ...browserDeviceInfo, ...networkConnectivity, iceServers: { ...iceServers } };
    new Logger().info('deviceInfo is ready', deviceInfo);
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
  return DeviceInfoService.updateDeviceInfo(apiEndpoint ? apiEndpoint : cachedApiEndpoint, body);
}

/**
 * Reset all device information
 */
function resetDeviceInfo() {
  deviceInfo = {};
}

export { getDeviceInfo, resetDeviceInfo, updateDeviceInfo, getNetworkDeviceInfo };
