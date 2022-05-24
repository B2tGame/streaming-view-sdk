import networkConnectivity from './stores/networkConnectivity';
import { getDeviceInfo, updateDeviceInfo } from './stores/deviceInfo';
import Logger from './Logger';

export default function newMeasurementScheduler({ navigatorConnection, apiEndpoint, interval, onMeasures }) {
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
        if (measures && onMeasures) {
          // onMeasures might be heavy, so we schedule it in its own queue
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
    navigatorConnection.onchange = () => null;
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

  // This function is used only by Creek
  const changeApiEndpoint = (newEndpoint) => (apiEndpoint = newEndpoint);

  return { startMeasuring, stopMeasuring, changeApiEndpoint };
}
