import { getDeviceInfo } from './deviceInfo';

const axios = require('axios').default;
const CancelToken = axios.CancelToken;

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
const MEASUREMENT_LEVEL_BASIC = 'basic';
const MEASUREMENT_LEVEL_ADVANCED = 'advanced';

const DOWNLOAD_SPEED_RACE_FOR_MS = 2000;
const DOWNLOAD_DATASOURCE_NAME = 'random4000x4000.jpg';

const defaultNetworkConnectivity = {
  roundTripTime: undefined,
  downloadSpeed: undefined,
  recommendedRegion: undefined,
  measurementLevel: undefined
};
let networkConnectivity = { ...defaultNetworkConnectivity };
let downloadSpeed = undefined; // in Mbps

/**
 * Reset all network connectivity data
 */
function resetNetworkConnectivity() {
  networkConnectivity = { ...defaultNetworkConnectivity };
}

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
 * @return {Promise<{roundTripTime: number|undefined, downloadSpeed: number|undefined, measurementLevel: string|undefined}>}
 */
function getBrowserMeasurement(browserConnection = undefined) {
  const connection = browserConnection
    ? browserConnection
    : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

  return Promise.resolve({
    roundTripTime: connection.rtt,
    downloadSpeed: convertMbitToBytes(connection.downlink),
    measurementLevel: MEASUREMENT_LEVEL_BROWSER
  });
}

/**
 *
 * @return {Promise<{measurementLevel: string, recommendedRegion}>}
 */
function getBasicMeasurement() {
  return getDeviceInfo().then((deviceInfo) => ({
    recommendedRegion: (([...deviceInfo.recommendation] || []).shift() || {}).edgeRegion,
    measurementLevel: MEASUREMENT_LEVEL_BASIC
  }));
}

/**
 *
 * @return {Promise<{measurementLevel: string, downloadSpeed: any}>}
 */
function getAdvancedMeasurement() {
  /**
   * Downloader function used for speed-test measurements
   * @param {string} url Download url
   * @return {Promise<boolean>}
   */
  const download = (url) => {
    let firstByteReceivedAt = undefined;
    let firstLoadedBytes = undefined;
    let cancelDownload;

    return axios
      .get(url, {
        onDownloadProgress: (event) => {
          const dateNow = Date.now();
          const loaded = event.loaded;
          const timeSinceFirstByte = dateNow - firstByteReceivedAt;

          if (firstByteReceivedAt === undefined) {
            firstByteReceivedAt = dateNow;
            firstLoadedBytes = loaded;
          } else {
            downloadSpeed = ((loaded - firstLoadedBytes) * 8000) / timeSinceFirstByte / 1024 / 1024;

            if (cancelDownload && dateNow >= firstByteReceivedAt + DOWNLOAD_SPEED_RACE_FOR_MS) {
              cancelDownload();
            }
          }
        },
        cancelToken: new CancelToken(function executor(canceler) {
          // An executor function receives a cancel function as a parameter
          cancelDownload = canceler;
        })
      })
      .then(() => true)
      .catch((err) => err.name !== 'Error');
  };

  /**
   * Recursive function to manage download speed measurement and fallback case.
   *
   * @param {[]} speedTestUrls Array of possible speed test urls
   * @return {Promise<boolean>}
   */
  const downloadManager = (speedTestUrls) => {
    return new Promise((resolve, reject) => {
      if (speedTestUrls.length === 0) {
        reject(false);
      }

      // add a cache break query param to avoid speed measurement distorsion
      return download(speedTestUrls.shift() + '?/cb=' + Math.random()).then((successfull) =>
        resolve(successfull ? successfull : downloadManager(speedTestUrls))
      );
    });
  };

  return getDeviceInfo()
    .then((deviceInfo) =>
      downloadManager(
        ([...deviceInfo.recommendation] || [])
          .reduce((output, rec) => [...output, ...rec.measurementEndpoints], [])
          .map((endpoint) => endpoint + '/' + DOWNLOAD_DATASOURCE_NAME)
      )
    )
    .then(() =>
      downloadSpeed
        ? {
            downloadSpeed: downloadSpeed,
            measurementLevel: MEASUREMENT_LEVEL_ADVANCED
          }
        : {}
    );
}

/**
 * Measure network connectivity on different levels
 *
 * @param browserConnection NetworkInformation from the browser
 * @return {Promise<{measurementLevel: undefined, downloadSpeed: undefined, recommendedRegion: undefined, roundTripTime: undefined}>}
 */
function measureNetworkConnectivity(browserConnection = undefined) {
  return getBrowserMeasurement(browserConnection)
    .then((browserMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...browserMeasurement };
    })
    .then(() => getBasicMeasurement())
    .then((basicMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...basicMeasurement };
    })
    .then(() => getAdvancedMeasurement())
    .then((advancedMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...advancedMeasurement };
    })
    .then(() => {
      return networkConnectivity;
    });
}

/**
 * Gets the actual state of network connectivity information
 *
 * @param browserConnection
 * @return {Promise<{measurementLevel: (string|undefined), downloadSpeed: (number|undefined), recommendedRegion: (string|undefined), roundTripTime: (number|undefined)}>}
 */
function getNetworkConnectivity(browserConnection = undefined) {
  return Promise.resolve().then(() => {
    if (networkConnectivity.measurementLevel === undefined) {
      return getBrowserMeasurement(browserConnection).then((browserMeasurement) => {
        return { ...networkConnectivity, ...browserMeasurement };
      });
    }

    return networkConnectivity;
  });
}

export { measureNetworkConnectivity, getNetworkConnectivity, resetNetworkConnectivity };
