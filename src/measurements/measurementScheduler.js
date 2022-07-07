import networkConnectivity from './service/networkConnectivity';
import { getDeviceInfo, updateDeviceInfo } from './service/deviceInfo';
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

  /*
   * lastMeasure doesn't /need/ to be here, but it removes opportunities for the SDK user to do things wrong.
   */
  let lastMeasure = null;

  // State management
  const startMeasuring = () => {
    clearTimeout(nextScheduledRun);
    isStopped = false;
    nextScheduledRun = null;

    const run = () => {
      clearTimeout(nextScheduledRun);
      takeOneMeasurement((measures) => {
        if (!isStopped) {
          nextScheduledRun = setTimeout(run, interval);
        }
        if (measures) {
          lastMeasure = measures;
          // Just in case onMeasures is heavy, let's schedule it in its own queue
          setTimeout(() => onMeasures(measures), 0);
        }
      });
    };

    navigatorConnection.onchange = run;
    run();
  };

  const stopMeasuring = () => {
    clearTimeout(nextScheduledRun);
    isStopped = true;
    nextScheduledRun = null;
    navigatorConnection.onchange = noop;
  };

  // Logging
  const logger = new Logger();

  const logError = (error) => {
    console.warn('Streaming Agent', error);
    logger.error('Streaming Agent', error);
  };

  // Actually take the measurement
  const takeOneMeasurement = (callback) =>
    getDeviceInfo(apiEndpoint)
      .then((deviceInfo) =>
        networkConnectivity
          .measure(apiEndpoint, deviceInfo.recommendation)
          .then((networkConnectivityInfo) => ({ networkConnectivityInfo, deviceInfo }))
      )
      .then(({ networkConnectivityInfo, deviceInfo }) => {
        console.info('networkConnectivityInfo', networkConnectivityInfo);
        updateDeviceInfo(apiEndpoint, { rttRegionMeasurements: networkConnectivityInfo.rttStatsByRegionByTurn });
        callback({ networkConnectivityInfo, deviceInfo });
      })
      .catch((err) => {
        logError(err);
        callback(null);
      });

  // HACK: this also shouldn't be here, this module is feature creeping a bit...
  const getPredictedGameExperiences = (pollingInterval = 500) => {
    const waitAndRetry = () =>
      new Promise((resolve) => setTimeout(() => resolve(getPredictedGameExperiences(pollingInterval)), pollingInterval));

    const goAhead = () =>
      networkConnectivity.getPredictedGameExperiences(apiEndpoint, lastMeasure.deviceInfo.deviceInfoId, lastMeasure.connectivityInfo);

    return lastMeasure ? goAhead() : waitAndRetry();
  };

  // This function is used only by Creek
  const changeApiEndpoint = (newEndpoint) => (apiEndpoint = newEndpoint);

  const getLastMeasure = () => lastMeasure;

  startMeasuring();

  return { startMeasuring, stopMeasuring, changeApiEndpoint, getLastMeasure, getPredictedGameExperiences };
}
