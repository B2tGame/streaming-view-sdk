const networkConnectivity = {};

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';

/**
 * @param downloadSpeed
 * @returns {undefined|number}
 */
function convertMbitToBytes(downloadSpeed) {
  if (downloadSpeed) {
    return (downloadSpeed * 1000 * 1000) / 8;
  }

  return undefined;
}

/**
 *
 * @param browserConnection NetworkInformation from the browser
 */
function performBrowserMeasurement(browserConnection) {
  networkConnectivity.roundTripTime = browserConnection.rtt;
  networkConnectivity.downloadSpeed = convertMbitToBytes(browserConnection.downlink);
  networkConnectivity.measurementLevel = MEASUREMENT_LEVEL_BROWSER;
}

/**
 *
 * @param browserConnection
 * @returns {Promise<{}>}
 */
function getNetworkConnectivity(browserConnection = undefined) {
  if (
    networkConnectivity.measurementLevel === undefined ||
    networkConnectivity.measurementLevel === MEASUREMENT_LEVEL_BROWSER
  ) {
    const connection = browserConnection
      ? browserConnection
      : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    performBrowserMeasurement(connection);
  }

  return Promise.resolve(networkConnectivity);
}

/**
 * Reset all network connectivity data
 */
function resetNetworkConnectivity() {
  Object.keys(networkConnectivity).forEach((index) => {
    delete networkConnectivity[index];
  });
}

export { getNetworkConnectivity, resetNetworkConnectivity };
