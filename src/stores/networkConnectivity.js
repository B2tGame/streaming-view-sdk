import { getDeviceInfo } from './deviceInfo';

const axios = require('axios').default;
const CancelToken = axios.CancelToken;

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
const MEASUREMENT_LEVEL_BASIC = 'basic';
const MEASUREMENT_LEVEL_ADVANCED = 'advanced';

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
 * @return {Promise<{measurementLevel: string, downloadSpeed: number}>}
 */
function getAdvancedMeasurement() {
  let cancelDownload;

  const getLatestAverage = (source, skipPercent) => {
    const avgSlice = source.slice(Math.round(skipPercent * source.length), source.length - 1);
    //console.log('getLatestAverage', { source, avgSlice });
    return parseFloat(
      (avgSlice.length ? avgSlice.reduce((a, b) => a + b, 0) / avgSlice.length : source.pop()).toFixed(2)
    );
  };

  const download = (url) => {
    const startTime = Date.now();
    let mbps = undefined;
    const mbpsMeasurements = [];

    //console.log({ url, startTime, ms: Date.now() - startTime });
    return axios
      .get(url, {
        onDownloadProgress: (event) => {
          const loaded = event.loaded;
          const progress = Math.round((event.loaded * 100) / event.total);
          const ms = Date.now() - startTime;
          mbps = parseFloat(((loaded * 8000) / ms / 1024 / 1024).toFixed(2));
          mbpsMeasurements.push(mbps);
          downloadSpeed = getLatestAverage([...mbpsMeasurements], 0.6);
          console.log({ ms, progress, loaded, mbps });
        },
        cancelToken: new CancelToken(function executor(canceler) {
          // An executor function receives a cancel function as a parameter
          cancelDownload = canceler;
        })
      })
      .catch(() => {
        downloadSpeed = undefined;
      });
  };

  return getDeviceInfo()
    .then((deviceInfo) => {
      const baseUrl = 'http://18.193.172.176/measurement/';
      const speedTestUrls = ((deviceInfo.recommendation || []).shift() || {}).speedTestUrls || ['random4000x4000.jpg'];

      return Promise.race([
        download(baseUrl + speedTestUrls.shift() + '?/cb=' + Math.random()),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    })
    .then(() => {
      cancelDownload();
      return {
        downloadSpeed: downloadSpeed,
        measurementLevel: MEASUREMENT_LEVEL_ADVANCED
      };
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
