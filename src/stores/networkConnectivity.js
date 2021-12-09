import { getDeviceInfo } from './deviceInfo';
import StreamingEvent from '../StreamingEvent';
import StreamWebRtc from '../service/StreamWebRtc';
import Measurement from '../service/Measurement';

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
const MEASUREMENT_LEVEL_BASIC = 'basic';
const MEASUREMENT_LEVEL_ADVANCED = 'advanced';

const MAX_RECOMMENDATION_COUNT = 3;
const DELAY_DEVICE_INFO_MS = 3000;
const WEBRTC_TIME_TO_CONNECTED = 5000;
const ADVANCED_MEASUREMENT_TIMEOUT = 5000;

const defaultNetworkConnectivity = {
  roundTripTime: undefined,
  downloadSpeed: undefined,
  recommendedRegion: undefined,
  rttRegionMeasurements: undefined,
  measurementLevel: undefined
};
let networkConnectivity = { ...defaultNetworkConnectivity };
let webrtcRoundTripTimeValuesMulti = {};
let webrtcRoundTripTimeStatsMulti = {};
let predictedGameExperienceMulti = {};

/**
 * Reset all network connectivity data
 */
const resetNetworkConnectivity = () => {
  networkConnectivity = { ...defaultNetworkConnectivity };
};

/**
 * @param downloadSpeed
 * @returns {undefined|number}
 */
const convertMbitToBytes = (downloadSpeed) => {
  if (downloadSpeed) {
    return (downloadSpeed * 1024 * 1024) / 8;
  }

  return undefined;
};

/**
 * Get Browser measurement attributes
 * @param browserConnection NetworkInformation from the browser
 * @return {Promise<{roundTripTime: number|undefined, downloadSpeed: number|undefined, measurementLevel: string|undefined}>}
 */
const getBrowserMeasurement = (browserConnection = undefined) => {
  const connection = browserConnection
    ? browserConnection
    : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

  return Promise.resolve({
    roundTripTime: connection.rtt,
    downloadSpeed: convertMbitToBytes(connection.downlink),
    measurementLevel: MEASUREMENT_LEVEL_BROWSER
  });
};

/**
 * Get Basic measurement attributes, designed to be used in getBrowserMeasurement.
 * @return {Promise<{measurementLevel: string, recommendedRegion}>}
 */
const getBasicMeasurement = () => {
  return getDeviceInfo().then((deviceInfo) => ({
    recommendedRegion: (((deviceInfo || {}).recommendation || []).find(() => true) || {}).edgeRegion,
    measurementLevel: MEASUREMENT_LEVEL_BASIC
  }));
};

/**
 * Get Advanced measurement attributes, designed to be used in getBrowserMeasurement.
 * @return {Promise<{measurementLevel: string, downloadSpeed: any}>}
 */
const getAdvancedMeasurement = () => {
  /**
   * Recursive function to manage download speed measurement and fallback case.
   * @param {[]} recommendation Array of possible recommendations
   * @return {Promise<boolean>}
   */
  const connectionManagerMultiRegion = (recommendation) => {
    let countRecommendation = 0;
    for (let i = 0; i < recommendation.length; ++i) {
      countRecommendation += recommendation[i].measurementEndpoints.length || 0;
    }
    if (countRecommendation === 0) {
      return Promise.resolve(false);
    }

    const selectedEdges = [];
    for (let i = 0; i < recommendation.length && selectedEdges.length < MAX_RECOMMENDATION_COUNT; ++i) {
      if (recommendation[i].measurementEndpoints.length) {
        selectedEdges.push({
          baseUrls: recommendation[i].measurementEndpoints.slice(0, MAX_RECOMMENDATION_COUNT),
          region: recommendation[i].edgeRegion
        });
      }
    }

    return webrtcManagerMultiRegion(selectedEdges).then((webrtcManagerSuccessful) => {
      if (webrtcManagerSuccessful) {
        return webrtcManagerSuccessful;
      }
      return connectionManagerMultiRegion(recommendation);
    });
  };

  /**
   * Recursive function to manage webrtc rtt measurement
   * @param {{baseUrls: string[], region: string}} edge
   * @return {Promise<boolean>}
   */
  const getWebRtcMeasurement = (edge) => {
    if (edge.baseUrls.length === 0) {
      return Promise.resolve(false);
    }

    const webRtcHost = `${edge.baseUrls.shift()}/webrtc`;
    console.log('WebRtc connect attempt:', webRtcHost, 'for:', edge.region);

    return new Promise((resolve, reject) => {
      let streamWebRtc = undefined;
      const onWebRtcClientConnected = () => {
        console.log('WebRtc connected to:', edge.region);
        webrtcRoundTripTimeValuesMulti[edge.region] = [];
        setTimeout(() => stopMeasurement(), ADVANCED_MEASUREMENT_TIMEOUT);
      };
      const onWebRtcRoundTripTimeMeasurement = (webrtcRtt) => {
        webrtcRoundTripTimeValuesMulti[edge.region].push(webrtcRtt);
        predictedGameExperienceMulti[edge.region] = Measurement.calculatePredictedGameExperience(webrtcRtt, 0, edge.region)[
          Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT
        ];
      };
      const stopMeasurement = (closeAction = undefined) => {
        if ((webrtcRoundTripTimeValuesMulti[edge.region] || []).length > 0) {
          webrtcRoundTripTimeStatsMulti[edge.region] = StreamWebRtc.calculateRoundTripTimeStats(
            webrtcRoundTripTimeValuesMulti[edge.region]
          );
        }
        streamWebRtc
          .off(StreamingEvent.WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected)
          .off(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement)
          .close();

        if (closeAction) {
          closeAction();
        } else {
          resolve((webrtcRoundTripTimeValuesMulti[edge.region] || []).length > 0);
        }
      };

      try {
        console.log('DEBUGGGGG');
        streamWebRtc = new StreamWebRtc(webRtcHost);
        setTimeout(() => stopMeasurement(), WEBRTC_TIME_TO_CONNECTED);
        streamWebRtc
          .on(StreamingEvent.WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected)
          .on(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement);
      } catch (e) {
        stopMeasurement(() => reject(false));
      }
    }).then((result) => {
      if (result) {
        return result;
      } else {
        return getWebRtcMeasurement(edge);
      }
    });
  };

  /**
   * Manages webrtc rtt measurements for multiple regions
   * @param {[]} selectedEdges Array of possible edges
   * @return {Promise<boolean>}
   */
  const webrtcManagerMultiRegion = (selectedEdges) => {
    return Promise.all(selectedEdges.map((edge) => getWebRtcMeasurement(edge))).then((successful) => {
      for (let success in successful) {
        if (success) {
          return true;
        }
      }
      return false;
    });
  };

  return getDeviceInfo()
    .then((deviceInfo) => connectionManagerMultiRegion((deviceInfo || {}).recommendation || []))
    .then(() => {
      let minRtt = undefined;
      const finalResult = {};
      for (const [region, stats] of Object.entries(webrtcRoundTripTimeStatsMulti)) {
        if (minRtt === undefined || minRtt > stats.rtt) {
          minRtt = stats.rtt;
          networkConnectivity.recommendedRegion = region;
        }
        finalResult[region] = {
          rtt: Measurement.roundToDecimals(stats.rtt, 0),
          stdDev: Measurement.roundToDecimals(stats.standardDeviation, 0)
        };
      }

      networkConnectivity.rttRegionMeasurements = finalResult;
    })
    .then(() => ({
      predictedGameExperience: predictedGameExperienceMulti[networkConnectivity.recommendedRegion],
      measurementLevel: MEASUREMENT_LEVEL_ADVANCED
    }));
};

/**
 * Measure network connectivity on different levels
 *
 * @param browserConnection NetworkInformation from the browser
 * @param measureWebrtcRtt
 * @return {Promise<{measurementLevel: undefined, downloadSpeed: undefined, recommendedRegion: undefined, rttRegionMeasurements: undefined, roundTripTime: undefined}>}
 */
const measureNetworkConnectivity = (browserConnection = undefined, measureWebrtcRtt = true) => {
  return getBrowserMeasurement(browserConnection)
    .then((browserMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...browserMeasurement };
    })
    .then(() => getBasicMeasurement())
    .then((basicMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...basicMeasurement };
    })
    .then(() =>
      measureWebrtcRtt
        ? new Promise(
            (resolve) => setTimeout(() => resolve(getAdvancedMeasurement()), DELAY_DEVICE_INFO_MS) // delay the execution
          )
        : Promise.resolve({})
    )
    .then((advancedMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...advancedMeasurement };
      console.log('networkConnectivity:', networkConnectivity);
    })
    .then(() => networkConnectivity);
};

/**
 * Gets the actual state of network connectivity information
 *
 * @param browserConnection
 * @return {Promise<{measurementLevel: (string|undefined), downloadSpeed: (number|undefined), recommendedRegion: (string|undefined), rttRegionMeasurements: (string[]|undefined), roundTripTime: (number|undefined)}>}
 */
const getNetworkConnectivity = (browserConnection = undefined) => {
  return Promise.resolve().then(() => {
    if (networkConnectivity.measurementLevel === undefined) {
      return getBrowserMeasurement(browserConnection);
    }

    return networkConnectivity;
  });
};

export { measureNetworkConnectivity, getNetworkConnectivity, resetNetworkConnectivity };
