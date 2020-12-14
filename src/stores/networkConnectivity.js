import { getDeviceInfo } from './deviceInfo';

const axios = require('axios').default;
const CancelToken = axios.CancelToken;

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
const MEASUREMENT_LEVEL_BASIC = 'basic';
const MEASUREMENT_LEVEL_ADVANCED = 'advanced';

const DOWNLOAD_SPEED_RACE_FOR_MS = 200;

const defaultNetworkConnectivity = {
  roundTripTime: undefined,
  downloadSpeed: undefined,
  recommendedRegion: undefined,
  measurementLevel: undefined
};
let networkConnectivity = { ...defaultNetworkConnectivity };
let downloadSpeed = undefined; // in Mbps with 2 decimal precision

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
    //TODO: set the correct region!
    recommendedRegion: ((deviceInfo.recommendation || []).shift() || {}).edgeRegion,
    measurementLevel: MEASUREMENT_LEVEL_BASIC
  }));
}

/**
 *
 * @return {Promise<{measurementLevel: string, downloadSpeed: any}>}
 */
function getAdvancedMeasurement() {
  const download = (url) => {
    console.log({ url });
    let firstByteReceivedAt = undefined;
    let firstLoadedBytes = undefined;
    let cancelDownload;

    return axios
      .get(url, {
        onDownloadProgress: (event) => {
          const dateNow = Date.now();
          const loaded = event.loaded;
          const progress = Math.round((event.loaded * 100) / event.total);
          const timeSinceFirstByte = dateNow - firstByteReceivedAt;

          if (firstByteReceivedAt === undefined) {
            firstByteReceivedAt = dateNow;
            firstLoadedBytes = loaded;
          } else {
            downloadSpeed = ((loaded - firstLoadedBytes) * 8000) / timeSinceFirstByte / 1024 / 1024;
            console.log({ ms: timeSinceFirstByte, progress, loaded, downloadSpeed });

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

  const downloadManager = (baseUrl, speedTestUrls) => {
    return new Promise((resolve, reject) => {
      if (speedTestUrls.length === 0) {
        reject(false);
      }

      return download(baseUrl + speedTestUrls.shift() + '?/cb=' + Math.random()).then((successfull) =>
        resolve(successfull ? successfull : downloadManager(baseUrl, speedTestUrls))
      );
    });
  };

  return getDeviceInfo()
    .then((deviceInfo) => {
      const baseUrl = 'http://18.193.172.176/measurement/';
      const speedTestUrls = ((deviceInfo.recommendation || []).shift() || {}).speedTestUrls || [
        undefined,
        'FAIL_CASE',
        'ALMOST_THERE',
        'random4000x4000.jpg'
      ];

      return downloadManager(baseUrl, speedTestUrls);
    })
    .then((resp) => {
      console.log({ downloadResp: resp });
      return downloadSpeed
        ? {
            downloadSpeed: downloadSpeed,
            measurementLevel: MEASUREMENT_LEVEL_ADVANCED
          }
        : {};
    });
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
