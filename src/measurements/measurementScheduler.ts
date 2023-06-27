import * as deviceInfoService from './service/deviceInfo';
import * as networkConnectivity from './service/networkConnectivity';
import * as log from './Logger';
import { DeviceConfiguration, DeviceInfo } from './service/deviceInfo';

const noop = () => null;

export type SingleMeasurement = {
  networkConnectivityInfo: networkConnectivity.Measurement;
  deviceInfo: deviceInfoService.DeviceInfo;
};

type MeasurementSchedulerOptions = {
  navigatorConnection: NetworkInformation;
  apiEndpoint: string;
  interval: number;
  onMeasures: (measurement: SingleMeasurement) => void;
  userConfiguration: DeviceConfiguration;
  userAuthToken: string;
};

export type MeasurementScheduler = ReturnType<typeof newMeasurementScheduler>;

export default function newMeasurementScheduler({
  navigatorConnection,
  apiEndpoint,
  interval,
  onMeasures = noop,
  userConfiguration,
  userAuthToken,
}: MeasurementSchedulerOptions) {
  /*


   State modelling

   The possible states are:
    a) currently running a measurement
    b) not running, but next run is scheduled
    c) not running, paused

   `nextScheduledRun` contains the timerId produced by window.setTimeout.
   It should be set only in state b) and should always be `null` in state a) and c).

   `isStopped` should be `true` only in state c) and `false` otherwise

   When a measurement is being performed, nextScheduledRun should be null and isStopped should be false.

   There are no valid states when `nextScheduledRun` is run and `isStopped` is true.

   NOTE: calling startMeasuring() while state is a), ie when already running a measure, will NOT
   interrupt the running measurement!

  */
  let nextScheduledRun: number;
  let isStopped = false;

  // No point in requesting deviceInfo more than once
  let cachedDeviceInfo: DeviceInfo;
  let cacheFetchInProgress = false;

  const getDeviceInfo = async () => {
    const waitAndRetry = () => {
      return new Promise<DeviceInfo>((resolve) => window.setTimeout(() => resolve(getDeviceInfo()), 200));
    };

    if (cacheFetchInProgress) return waitAndRetry();

    if (!cachedDeviceInfo) {
      cacheFetchInProgress = true;
      try {
        cachedDeviceInfo = await deviceInfoService.get(apiEndpoint, userConfiguration, userAuthToken);
      } catch (err) {
        logError(err);
      }
    }

    cacheFetchInProgress = false;
    return cachedDeviceInfo;
  };

  /*
   * lastMeasure doesn't /need/ to be here, but it removes opportunities for the SDK user to do things wrong.
   */
  let lastMeasure: SingleMeasurement;

  // State management
  function startMeasuring() {
    window.clearTimeout(nextScheduledRun);
    isStopped = false;
    nextScheduledRun = -1;

    const run = async () => {
      window.clearTimeout(nextScheduledRun);

      const measures = await takeOneMeasurement().catch((err) => {
        logError(err);
        return null;
      });

      if (!isStopped) {
        nextScheduledRun = window.setTimeout(run, interval);
      }

      if (measures) {
        lastMeasure = measures;
        // Just in case onMeasures is heavy, let's schedule it in its own queue
        window.setTimeout(() => onMeasures(measures), 0);
      }
    };

    navigatorConnection.onchange = run;
    run();
  }

  function stopMeasuring() {
    window.clearTimeout(nextScheduledRun);
    isStopped = true;
    nextScheduledRun = -1;
    navigatorConnection.onchange = noop;
  }

  // Logging
  const logError = (error: Error) => {
    log.error('Streaming Agent', error);
  };

  // Actually take the measurement
  const takeOneMeasurement = async (): Promise<SingleMeasurement> => {
    const deviceInfo = await getDeviceInfo();

    const networkConnectivityInfo = await networkConnectivity.measure(apiEndpoint, deviceInfo.recommendation);

    log.info('networkConnectivityInfo', networkConnectivityInfo);

    deviceInfoService.update(apiEndpoint, deviceInfo.deviceInfoId, userAuthToken, {
      rttRegionMeasurements: networkConnectivityInfo.rttStatsByRegionByTurn,
      predictedGameExperience: networkConnectivityInfo.predictedGameExperienceStats,
    });

    return { networkConnectivityInfo, deviceInfo };
  };

  //
  // Start!
  //
  startMeasuring();

  //
  // API Functions
  //
  function getPredictedGameExperiences(pollingInterval = 500) {
    const waitAndRetry = () =>
      new Promise((resolve) => window.setTimeout(() => resolve(getPredictedGameExperiences(pollingInterval)), pollingInterval));

    const goAhead = () =>
      networkConnectivity.getPredictedGameExperiences(
        apiEndpoint,
        lastMeasure.deviceInfo.deviceInfoId,
        lastMeasure.networkConnectivityInfo
      );

    return lastMeasure ? goAhead() : waitAndRetry();
  }

  function getGameAvailability() {
    return getDeviceInfo().then((deviceInfo) => networkConnectivity.getGameAvailability(apiEndpoint, deviceInfo.deviceInfoId));
  }

  function getConnectivityInfo() {
    return Promise.resolve(lastMeasure ? lastMeasure.networkConnectivityInfo : {});
  }

  return {
    startMeasuring,
    stopMeasuring,

    // API
    getConnectivityInfo,
    getDeviceInfo: function () {
      return getDeviceInfo().then(({ deviceInfoId, userId }) => ({ deviceInfoId, userId }));
    },
    getGameAvailability,
    getPredictedGameExperiences,
  };
}
