import axios from 'axios';
import StreamWebRtc from './StreamWebRtc';
import PredictGameExperience from './PredictGameExperience';

const MAX_RECOMMENDATION_COUNT = 3;
const WEBRTC_TIME_TO_CONNECTED = 5000;
const ADVANCED_MEASUREMENT_TIMEOUT = 5000;

function asyncDoWhile(functionToRetry, shouldRetry) {
  return functionToRetry().then((result) => (shouldRetry(result) ? asyncDoWhile(functionToRetry, shouldRetry) : result));
}

/**
 *
 * @param {string} apiEndpoint
 * @param {string} region
 * @returns {Promise<*>}
 */
const requestIceServers = (apiEndpoint, region) => {
  return axios
    .get(`${apiEndpoint}/api/streaming-games/edge-node/ice-server/${region}`, { timeout: 2500 })
    .then((result) => result.data || {});
};

/**
 * Collect RTT for a given region and turn
 *
 * @params {{turnName: string, region: string, webRtcHost: string, iceCandidates: *}}
 * @returns {Promise<Array<number>>}
 */
function getRTTMeasurements({ turnName, region, webRtcHost, iceCandidates }) {
  return new Promise((resolve) => {
    const rttMeasurements = [];

    let stopMeasurement;

    const onConnected = () => {
      setTimeout(() => stopMeasurement(), ADVANCED_MEASUREMENT_TIMEOUT);
    };

    const onRttMeasure = (rtt) => {
      rttMeasurements.push(rtt);
    };

    StreamWebRtc.initRttMeasurement({
      host: `${webRtcHost}/${turnName}`,
      iceServerCandidates: iceCandidates,
      onConnected,
      onRttMeasure,
    }).then((closeStreamWebRtc) => {
      stopMeasurement = () => {
        // This function will likely be called multiple times:
        //  * Closing the same streamWebRtc object multiple times should be fine
        //  * Calling resolve() multiple times should also be safe https://stackoverflow.com/questions/20328073/is-it-safe-to-resolve-a-promise-multiple-times

        closeStreamWebRtc();
        resolve(rttMeasurements);
      };

      setTimeout(() => stopMeasurement(), WEBRTC_TIME_TO_CONNECTED);
    });
  });
}

/**
 * Collect RTT for a whole array of edges
 *
 * @params {Array<{region: string, webRtcHost: string}>}
 * @params {*}
 * @return {Promise<Array<{region: string, turnName: string, rttMeasurements: Array<number>}>>}
 */
function getRTTMeasurementsForEdgeRegions(apiEndpoint, selectedEdges, iterationCounter) {
  return Promise.all(
    selectedEdges.map(({ edgeRegion, measurementEndpoints }) =>
      requestIceServers(apiEndpoint, edgeRegion).then((iceServers) =>
        Promise.all(
          Object.entries(iceServers).map(([turnName, iceCandidates]) =>
            getRTTMeasurements({
              webRtcHost: `${measurementEndpoints[iterationCounter % measurementEndpoints.length]}/webrtc`,
              region: edgeRegion,
              turnName,
              iceCandidates,
            }).then((rttMeasurements) => ({
              region: edgeRegion,
              turnName,
              rttMeasurements,
            }))
          )
        )
      )
    )
  ).then((perEdge) => [].concat(...perEdge));
}

/*
 * This is the function that we use to compare the quality of different connection options given a connection's RTT and stdDev.
 *
 * This must match https://bitbucket.org/appland/streaming-games/src/447faea77d5724494b545dc2d9e59df1812519db/service-coordinator/src/app/api/streaming-games/edge-node/ice-server.js#lines-43
 * TODO Ideally we'd have the function in a single place where every app can access it.
 *
 * @params {number} Round trip time average
 * @params {number} Round trip time standard deviation
 * @return {number} Connection quality (the lower the better)
 */
function estimateSpeed(rtt, stdDev) {
  return rtt + 2 * stdDev;
}

/**
 * Main entry point
 *
 * @params {*}
 * @params {Array<*>}
 * @return {{predictedGameExperience: number, recommendedRegion: string, rttRegionMeasurements: *}}
 */
function measure(apiEndpoint, recommendedEdges) {
  const selectedEdges = recommendedEdges.filter((edge) => edge.measurementEndpoints.length).slice(0, MAX_RECOMMENDATION_COUNT);

  // This should not happen but it's really nasty if it happens, so better guard against it.
  if (selectedEdges.length === 0) {
    return Promise.resolve({ rttStatsByRegionByTurn: {} });
  }

  // This is used so that at each iteration we can select, for each selectedEdge, a different measurementEndpoint
  let iterationCounter = 0;
  return asyncDoWhile(
    () => getRTTMeasurementsForEdgeRegions(apiEndpoint, selectedEdges, iterationCounter++),
    // keep trying until we have at least a turn with some measurements
    (turnMeasurements) => turnMeasurements.every((measurement) => measurement.rttMeasurements.length === 0)
  ).then((turnMeasurements) => {
    let minSpeed = Infinity;
    let minRegion = null;
    let minRtts = null;

    const statsByRegionByTurn = {};

    turnMeasurements.forEach(({ region, turnName, rttMeasurements }) => {
      if (rttMeasurements.length === 0) {
        return;
      }

      const stats = StreamWebRtc.calculateRoundTripTimeStats(rttMeasurements);

      statsByRegionByTurn[region] = statsByRegionByTurn[region] || {};
      statsByRegionByTurn[region][turnName] = stats;

      const delay = estimateSpeed(stats.rtt, stats.stdDev);

      if (minSpeed > delay) {
        minSpeed = delay;
        minRegion = region;
        minRtts = rttMeasurements;
      }
    });

    const model = new PredictGameExperience();
    const packetLostPercent = 0;
    const predictedGameExperience = minRtts.reduce((rtt) => model.predict(rtt, packetLostPercent));

    return {
      predictedGameExperience,
      recommendedRegion: minRegion,
      rttStatsByRegionByTurn: statsByRegionByTurn,
    };
  });
}

function getPredictedGameExperiences(apiEndpoint, deviceInfoId, connectivityInfo) {
  const encodedConnectivityInfo = encodeURIComponent(JSON.stringify(connectivityInfo));
  const encodedDeviceInfoId = encodeURIComponent(deviceInfoId);

  return axios
    .get(
      `${apiEndpoint}/api/streaming-games/predicted-game-experience?connectivity-info=${encodedConnectivityInfo}&deviceInfoId=${encodedDeviceInfoId}`
    )
    .then((result) => ({
      apps: (result.data || {}).apps || [],
    }));
}

function getGameAvailability(apiEndpoint, deviceInfoId) {
  const encodedDeviceInfoId = encodeURIComponent(deviceInfoId);

  return axios.get(`${apiEndpoint}/api/streaming-games/game-availability?deviceInfoId=${encodedDeviceInfoId}`).then((result) => ({
    apps: (result.data || {}).apps || [],
  }));
}

export default { measure, getPredictedGameExperiences, getGameAvailability };
