import axios from 'axios';

let deviceInfo = {};

/**
 *
 * @param {string} apiEndpoint
 * @returns {Promise<*>}
 */
function getNetworkDeviceInfo(apiEndpoint) {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, { timeout: 2500 })
    .then((result) => result.data);
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
    connectionEffectiveType: connection.effectiveType,
  });
}

/**
 *
 * @param {string} apiEndpoint
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{}>}
 */
function getDeviceInfo(apiEndpoint, browserConnection = undefined) {
  if (Object.keys(deviceInfo).length === 0) {
    return Promise.all([getNetworkDeviceInfo(apiEndpoint), getBrowserDeviceInfo(browserConnection)]).then(
      ([networkDeviceInfo, browserDeviceInfo]) => {
        deviceInfo = networkDeviceInfo;
        return { ...deviceInfo, ...browserDeviceInfo };
      }
    );
  } else {
    // Always get new browser device information but use cached networkDeviceInfo inside DeviceInfo
    return getBrowserDeviceInfo().then((browserDeviceInfo) => {
      return { ...deviceInfo, ...browserDeviceInfo };
    });
  }
}

/**
 * Reset all device information
 */
function resetDeviceInfo() {
  deviceInfo = {};
}

export { getDeviceInfo, resetDeviceInfo };
