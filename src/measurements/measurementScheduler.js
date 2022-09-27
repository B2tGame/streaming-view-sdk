import deviceInfoService from './service/deviceInfo';
import networkConnectivity from './service/networkConnectivity';
import Logger from './Logger';

const noop = () => null;

export default function newMeasurementScheduler({ navigatorConnection, apiEndpoint, interval, onMeasures = noop }) {
  /*

   State modelling

   The possible states are:
    a) currently running a measurement
    b) not running, but next run is scheduled
    c) not running, paused

   `nextScheduledRun` contains the timerId produced by setTimeout.
   It should be set only in state b) and should always be `null` in state a) and c).

   `isStopped` should be `true` only in state c) and `false` otherwise

   When a measurement is being performed, nextScheduledRun should be null and isStopped should be false.

   There are no valid states when `nextScheduledRun` is run and `isStopped` is true.

   NOTE: calling startMeasuring() while state is a), ie when already running a measure, will NOT
   interrupt the running measurement!

  */
  let nextScheduledRun = null;
  let isStopped = false;

  // No point in requesting deviceInfo more than once
  let cachedDeviceInfo = null;

  const getDeviceInfo = () =>
    Promise.resolve(cachedDeviceInfo || deviceInfoService.get(apiEndpoint).then((deviceInfo) => (cachedDeviceInfo = deviceInfo)));

  /*
   * lastMeasure doesn't /need/ to be here, but it removes opportunities for the SDK user to do things wrong.
   */
  let lastMeasure = null;

  // State management
  function startMeasuring() {
    clearTimeout(nextScheduledRun);
    isStopped = false;
    nextScheduledRun = null;

    const run = async () => {
      clearTimeout(nextScheduledRun);

      const measures = await takeOneMeasurement().catch((err) => {
        logError(err);
        return null;
      });

      if (!isStopped) {
        nextScheduledRun = setTimeout(run, interval);
      }

      if (measures) {
        lastMeasure = measures;
        // Just in case onMeasures is heavy, let's schedule it in its own queue
        setTimeout(() => onMeasures(measures), 0);
      }
    };

    navigatorConnection.onchange = run;
    run();
  }

  function stopMeasuring() {
    clearTimeout(nextScheduledRun);
    isStopped = true;
    nextScheduledRun = null;
    navigatorConnection.onchange = noop;
  }

  // Logging
  const logger = new Logger();

  const logError = (error) => {
    console.warn('Streaming Agent', error);
    logger.error('Streaming Agent', error);
  };

  // Actually take the measurement
  const takeOneMeasurement = async (callback) => {
    const deviceInfo = await getDeviceInfo();

    const networkConnectivityInfo = await networkConnectivity.measure(apiEndpoint, deviceInfo.recommendation);

    logger.info('networkConnectivityInfo', networkConnectivityInfo);

    deviceInfoService.update(apiEndpoint, deviceInfo.deviceInfoId, {
      rttRegionMeasurements: networkConnectivityInfo.rttStatsByRegionByTurn,
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
      new Promise((resolve) => setTimeout(() => resolve(getPredictedGameExperiences(pollingInterval)), pollingInterval));

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
