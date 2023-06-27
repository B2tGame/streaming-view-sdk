import axios, { AxiosResponse } from 'axios';
import * as StreamWebRtc from './StreamWebRtc';
import PredictGameExperience from './PredictGameExperience';
import { error } from '../Logger';

const MAX_RECOMMENDATION_COUNT = 3;
const WEBRTC_TIME_TO_CONNECTED = 5000;
const ADVANCED_MEASUREMENT_TIMEOUT = 5000;

function asyncDoWhile<V>(functionToRetry: () => Promise<V>, shouldRetry: (result: V) => boolean): Promise<V> {
  return functionToRetry().then((result) => (shouldRetry(result) ? asyncDoWhile(functionToRetry, shouldRetry) : result));
}

type IceServerResponse = { [turnName: string]: RTCIceServer[] };
const requestIceServers = (apiEndpoint: string, region: string) => {
  return axios
    .get<any, AxiosResponse<IceServerResponse>>(`${apiEndpoint}/api/streaming-games/edge-node/ice-server/${region}`, { timeout: 2500 })
    .then((result) => result.data || {});
};

type RttMeasurementsOptions = {
  turnName: string;
  region: string;
  webRtcHost: string;
  iceCandidates: RTCIceServer[];
};
/**
 * Collect RTT for a given region and turn
 *
 */
function getRTTMeasurements({ turnName, region, webRtcHost, iceCandidates }: RttMeasurementsOptions) {
  return new Promise<number[]>((resolve) => {
    const rttMeasurements: number[] = [];

    let stopMeasurement: () => void;

    const onConnected = () => {
      window.setTimeout(() => stopMeasurement(), ADVANCED_MEASUREMENT_TIMEOUT);
    };

    const onRttMeasure = (rtt: number) => {
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

      window.setTimeout(() => stopMeasurement(), WEBRTC_TIME_TO_CONNECTED);
    });
  });
}

type SelectedEdge = {
  edgeRegion: string;
  measurementEndpoints: string[];
};
/**
 * Collect RTT for a whole array of edges
 *
 * @params {Array<{region: string, webRtcHost: string}>}
 * @params {*}
 * @return {Promise<Array<{region: string, turnName: string, rttMeasurements: Array<number>}>>}
 */
function getRTTMeasurementsForEdgeRegions(apiEndpoint: string, selectedEdges: SelectedEdge[], iterationCounter: number) {
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
  ).then((perEdge) => perEdge.flat());
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
function estimateSpeed(rtt: number, stdDev: number) {
  return rtt + 2 * stdDev;
}

type RegionTurnStats = { [key: string]: { [turnName: string]: StreamWebRtc.RoundTripTimeStats } };

export type Measurement = {
  predictedGameExperience?: number;
  predictedGameExperienceStats?: {
    [alg: string]: {
      prediction: number;
      input: {
        packetLostPercent: number;
        rtt: string;
      };
    };
  };
  recommendedRegion?: string;
  rttStatsByRegionByTurn: RegionTurnStats;
};

export function measure(apiEndpoint: string, recommendedEdges: SelectedEdge[]): Promise<Measurement> {
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
    let minRegion: string = '';
    let minRtts: number[] = [];

    const statsByRegionByTurn: RegionTurnStats = {};

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

    if (!minRegion) {
      error('turnMeasurements: ', turnMeasurements);
      throw new Error('Not able to determine smallest RTT for turn services.');
    }

    const model = new PredictGameExperience();
    const packetLostPercent = 0;
    const predictedGameExperience = minRtts.reduce((rtt, prevRTT) => model.predict(rtt, packetLostPercent) ?? prevRTT);

    return {
      predictedGameExperience,
      predictedGameExperienceStats: {
        [PredictGameExperience.ALGORITHM_NAME]: {
          prediction: predictedGameExperience,
          input: {
            packetLostPercent,
            rtt: JSON.stringify(minRtts),
          },
        },
      },
      recommendedRegion: minRegion,
      rttStatsByRegionByTurn: statsByRegionByTurn,
    };
  });
}

export function getPredictedGameExperiences(apiEndpoint: string, deviceInfoId: string, connectivityInfo: object) {
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

export function getGameAvailability(apiEndpoint: string, deviceInfoId: string) {
  const encodedDeviceInfoId = encodeURIComponent(deviceInfoId);

  return axios.get(`${apiEndpoint}/api/streaming-games/game-availability?deviceInfoId=${encodedDeviceInfoId}`).then((result) => ({
    apps: (result.data || {}).apps || [],
  }));
}
