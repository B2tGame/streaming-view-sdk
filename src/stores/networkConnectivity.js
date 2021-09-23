import { getDeviceInfo } from './deviceInfo';
import StreamingEvent from '../StreamingEvent';
import StreamWebRtc from '../service/StreamWebRtc';
import Measurement from '../service/Measurement';

const MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
const MEASUREMENT_LEVEL_BASIC = 'basic';
const MEASUREMENT_LEVEL_ADVANCED = 'advanced';

const DELAY_DEVICE_INFO_MS = 3000;
const WEBRTC_TIME_TO_CONNECTED = 10000;
const ADVANCED_MEASUREMENT_TIMEOUT = 5000;

const defaultNetworkConnectivity = {
  roundTripTime: undefined,
  webrtcRoundTripTime: undefined,
  downloadSpeed: undefined,
  recommendedRegion: undefined,
  measurementLevel: undefined
};
let networkConnectivity = { ...defaultNetworkConnectivity };
let downloadSpeed = undefined; // in Mbps
let webrtcRoundTripTimeValues = [];
let webrtcRoundTripTimeStats = {
  rtt: undefined,
  standardDeviation: undefined
};
let predictedGameExperience = undefined;

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
   * @param {number} webrtcRtt
   */
  const onWebRtcRoundTripTimeMeasurement = (webrtcRtt) => {
    webrtcRoundTripTimeValues.push(webrtcRtt);
    predictedGameExperience = Measurement.calculatePredictedGameExperience(webrtcRtt, 0)[Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT];
  };

  /**
   * Recursive function to manage webrtc rtt measurement and fallback case.
   * @param {[]} availableEdges Array of possible speed test urls
   * @return {Promise<boolean>}
   */
  const webrtcManager = (availableEdges) => {
    if (availableEdges.length === 0) {
      return Promise.resolve(false);
    }

    const edge = availableEdges.shift();
    const webRtcHost = `${edge.endpoint}/webrtc`;
    console.log('WebRtc connect to:', webRtcHost);

    return new Promise((resolve, reject) => {
      let streamWebRtc = undefined;
      const onWebRtcClientConnected = () => {
        webrtcRoundTripTimeValues = [];
        setTimeout(() => stopMeasurement(), ADVANCED_MEASUREMENT_TIMEOUT);
      };
      const stopMeasurement = (closeAction = undefined) => {
        if (webrtcRoundTripTimeValues.length > 0) {
          webrtcRoundTripTimeStats = StreamWebRtc.calculateRoundTripTimeStats(webrtcRoundTripTimeValues);
        }
        streamWebRtc
          .off(StreamingEvent.WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected)
          .off(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement)
          .close();

        if (closeAction) {
          closeAction();
        } else {
          resolve(webrtcRoundTripTimeValues.length > 0);
        }
      };

      try {
        streamWebRtc = new StreamWebRtc(webRtcHost);
        setTimeout(() => stopMeasurement(), WEBRTC_TIME_TO_CONNECTED);
        streamWebRtc
          .on(StreamingEvent.WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected)
          .on(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement);
      } catch (e) {
        stopMeasurement(() => reject(false));
      }
    }).then((successful) => (successful ? successful : webrtcManager(availableEdges)));
  };

  return getDeviceInfo()
    .then((deviceInfo) => {
      const availableEdges = ((deviceInfo || {}).recommendation || []).reduce((output, rec) => {
        rec.measurementEndpoints.map((endpoint) => {
          if (networkConnectivity.recommendedRegion === undefined) {
            networkConnectivity.recommendedRegion = rec.edgeRegion;
          }
          return output.push({
            endpoint: endpoint,
            edgeRegion: rec.edgeRegion
          });
        });
        return output;
      }, []);

      return webrtcManager([...availableEdges]);
    })
    .then(() => ({
      webrtcRoundTripTime: webrtcRoundTripTimeStats.rtt,
      webrtcRoundTripTimeStandardDeviation: webrtcRoundTripTimeStats.standardDeviation,
      predictedGameExperience: predictedGameExperience,
      measurementLevel: MEASUREMENT_LEVEL_ADVANCED
    }));
};

/**
 * Measure network connectivity on different levels
 *
 * @param browserConnection NetworkInformation from the browser
 * @return {Promise<{measurementLevel: undefined, downloadSpeed: undefined, recommendedRegion: undefined, roundTripTime: undefined}>}
 */
const measureNetworkConnectivity = (browserConnection = undefined) => {
  return getBrowserMeasurement(browserConnection)
    .then((browserMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...browserMeasurement };
    })
    .then(() => getBasicMeasurement())
    .then((basicMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...basicMeasurement };
    })
    .then(
      () =>
        new Promise(
          (resolve) => setTimeout(() => resolve(getAdvancedMeasurement()), DELAY_DEVICE_INFO_MS) // delay the execution
        )
    )
    .then((advancedMeasurement) => {
      networkConnectivity = { ...networkConnectivity, ...advancedMeasurement };
    })
    .then(() => networkConnectivity);
};

/**
 * Gets the actual state of network connectivity information
 *
 * @param browserConnection
 * @return {Promise<{measurementLevel: (string|undefined), downloadSpeed: (number|undefined), recommendedRegion: (string|undefined), roundTripTime: (number|undefined)}>}
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
