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
   * @param {{}} iceServers Ice server options
   * @return {Promise<boolean>}
   */
  const connectionManagerMultiRegion = (recommendation, iceServers) => {
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
          region: recommendation[i].edgeRegion,
          iceServers: iceServers
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
   * @param {{baseUrls: string[], region: string, iceServers: {}}} edge
   * @return {Promise<boolean>}
   */
  const getWebRtcMeasurement = (edge) => {
    console.log('getWebRtcMeasurement EDGE:', edge);
    if (edge.baseUrls.length === 0) {
      return Promise.resolve(false);
    }

    const webRtcHost = `${edge.baseUrls.shift()}/webrtc`;
    console.log('DEBUG - webRtcHost:', webRtcHost);
    console.log(`WebRtc connect attempt: ${webRtcHost} region:${edge.region}, TURN:${edge.iceServers.name}`);

    return new Promise((resolve, reject) => {
      let streamWebRtc = undefined;
      const onWebRtcClientConnected = () => {
        console.log(`WebRtc connected to: ${edge.region}, TURN: ${edge.iceServers.name}`);
        if (webrtcRoundTripTimeValuesMulti[edge.region] === undefined) {
          webrtcRoundTripTimeValuesMulti[edge.region] = {};
        }
        if (webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name] === undefined) {
          webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name] = [];
        }

        setTimeout(() => stopMeasurement(), ADVANCED_MEASUREMENT_TIMEOUT);
      };
      const onWebRtcRoundTripTimeMeasurement = (webrtcRtt) => {
        webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name].push(webrtcRtt);
        predictedGameExperienceMulti[edge.region] = Measurement.calculatePredictedGameExperience(webrtcRtt, 0, edge.region)[
          Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT
        ];
      };
      const stopMeasurement = (closeAction = undefined) => {
        if (((webrtcRoundTripTimeValuesMulti[edge.region] || {})[edge.iceServers.name] || []).length > 0) {
          if (webrtcRoundTripTimeStatsMulti[edge.region] === undefined) {
            webrtcRoundTripTimeStatsMulti[edge.region] = {};
          }
          webrtcRoundTripTimeStatsMulti[edge.region][edge.iceServers.name] = StreamWebRtc.calculateRoundTripTimeStats(
            webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name]
          );
        }

        streamWebRtc
          .off(StreamingEvent.WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected)
          .off(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement)
          .close();

        if (closeAction) {
          closeAction();
        } else {
          resolve(((webrtcRoundTripTimeValuesMulti[edge.region] || {})[edge.iceServers.name] || []).length > 0);
        }
      };

      try {
        streamWebRtc = new StreamWebRtc(webRtcHost, edge.iceServers);
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
    return Promise.all(
      selectedEdges.reduce((acc, edge) => {
        for (const [key, iceCandidates] of Object.entries(edge.iceServers)) {
          const edgeToMeasure = {
            ...edge,
            iceServers: {
              name: key,
              candidates: iceCandidates
            }
          };
          acc.push(getWebRtcMeasurement(JSON.parse(JSON.stringify(edgeToMeasure))));
        }

        return acc;
      }, [])
    ).then((successful) => {
      for (let success in successful) {
        if (success) {
          return true;
        }
      }
      return false;
    });
  };

  return getDeviceInfo()
    .then((deviceInfo) => {
      console.log('DeviceInfo:', deviceInfo);
      const recommendation = (deviceInfo || {}).recommendation || [];
      const iceServers = (deviceInfo || {}).iceServers || {};
      return connectionManagerMultiRegion(recommendation, iceServers);
    })
    .then(() => {
      let minRtt = undefined;
      const finalResult = {};
      for (const [region, turns] of Object.entries(webrtcRoundTripTimeStatsMulti)) {
        for (const [turn, stats] of Object.entries(turns)) {
          if (minRtt === undefined || minRtt > stats.rtt) {
            minRtt = stats.rtt;
            networkConnectivity.recommendedRegion = region;
          }
          if (finalResult[region] === undefined) {
            finalResult[region] = {};
          }
          finalResult[region][turn] = {
            rtt: Measurement.roundToDecimals(stats.rtt, 0),
            stdDev: Measurement.roundToDecimals(stats.standardDeviation, 0)
          };
        }
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
      console.log('rttRegionMeasurements:', networkConnectivity.rttRegionMeasurements);
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
