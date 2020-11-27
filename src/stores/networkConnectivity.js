let networkConnectivity = {};

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
function getBrowserMeasurement(browserConnection = undefined) {
  const connection = browserConnection
    ? browserConnection
    : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

  return Promise.resolve({
    roundTripTime: connection.rtt,
    downloadSpeed: convertMbitToBytes(connection.downlink),
    recommendedRegion: undefined,
    measurementLevel: MEASUREMENT_LEVEL_BROWSER
  });
}

/**
 *
 * @param browserConnection NetworkInformation from the browser
 * @returns {Promise<{}>}
 */
function getNetworkConnectivity(browserConnection = undefined) {
  return Promise.resolve().then(() => {
    if (
      networkConnectivity.measurementLevel === undefined ||
      networkConnectivity.measurementLevel === MEASUREMENT_LEVEL_BROWSER
    ) {
      return getBrowserMeasurement(browserConnection)
        .then((browserMeasurement) => {
          networkConnectivity = browserMeasurement;
          return networkConnectivity;
        });
    }

    return networkConnectivity;
  });
}

/**
 * Reset all network connectivity data
 */
function resetNetworkConnectivity() {
  networkConnectivity = {};
}

export { getNetworkConnectivity, resetNetworkConnectivity };
