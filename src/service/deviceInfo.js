import Logger from './../Logger';
import DeviceInfoService from '../service/DeviceInfoService';

let deviceInfo = {};
let cachedApiEndpoint;

/**
 * @param {string} apiEndpoint
 * @return {Promise<{*}>}
 */
function getNetworkDeviceInfo(apiEndpoint) {
  if (Object.keys(deviceInfo).length > 0) {
    return Promise.resolve(deviceInfo);
  }

  cachedApiEndpoint = apiEndpoint;

  return DeviceInfoService.createDeviceInfo(apiEndpoint).then((networkDeviceInfo) => {
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
  const DPI = window.devicePixelRatio || 1;

  const browserDeviceInfo = {
    screenScale: DPI,
    screenWidth: Math.round(DPI * window.screen.width),
    screenHeight: Math.round(DPI * window.screen.height),
    viewportWidth: Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
    viewportHeight: Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0))
  };

  // this is using the deviceInfo global as cache
  return getNetworkDeviceInfo(apiEndpoint, {}).then((networkDeviceInfo) => {
    const deviceInfo = { ...networkDeviceInfo, ...browserDeviceInfo };
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
