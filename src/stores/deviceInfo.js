import axios from 'axios';

const deviceInfo = {};

/**
 *
 * @param apiEndpoint
 * @returns {Promise<*>}
 */
function fetchNetworkDeviceInfo(apiEndpoint) {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/device-info`, { timeout: 2500 })
    .then((result) => result.data);
}

/**
 *
 * @param browserConnection
 * @returns {{screenWidth: number, screenScale: (number), viewportWidth: number, screenHeight: number, viewportHeight: number, connectionEffectiveType: *, connectionType: *}}
 */
function fetchBrowserDeviceInfo(browserConnection) {
  const DPI = window.devicePixelRatio || 1;

  return {
    screenScale: DPI,
    screenWidth: Math.round(DPI * window.screen.width),
    screenHeight: Math.round(DPI * window.screen.height),
    viewportWidth: Math.round(DPI * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
    viewportHeight: Math.round(DPI * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)),
    connectionType: browserConnection.type,
    connectionEffectiveType: browserConnection.effectiveType,
  };
}

/**
 *
 * @param apiEndpoint
 * @param browserConnection
 * @returns {Promise<{}>}
 */
function getDeviceInfo(apiEndpoint, browserConnection = undefined) {
  if (Object.keys(deviceInfo).length === 0) {
    return fetchNetworkDeviceInfo(apiEndpoint)
      .then((networkDeviceInfo) => {
        const connection = browserConnection
          ? browserConnection
          : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        Object.assign(deviceInfo, networkDeviceInfo, fetchBrowserDeviceInfo(connection));
      })
      .then(() => deviceInfo);
  }

  return Promise.resolve(deviceInfo);
}

/**
 * Reset all device information
 */
function resetDeviceInfo() {
  Object.keys(deviceInfo).forEach((index) => {
    delete deviceInfo[index];
  });
}

export { getDeviceInfo, resetDeviceInfo };
