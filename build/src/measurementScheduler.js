"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = newMeasurementScheduler;

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _networkConnectivity = _interopRequireDefault(require("./service/networkConnectivity"));

var _deviceInfo = require("./service/deviceInfo");

var _Logger = _interopRequireDefault(require("./Logger"));

function newMeasurementScheduler(_ref) {
  var navigatorConnection = _ref.navigatorConnection,
      apiEndpoint = _ref.apiEndpoint,
      interval = _ref.interval,
      onMeasures = _ref.onMeasures;

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
  var nextScheduledRun = null;
  var isStopped = false; // State management

  var startMeasuring = function startMeasuring() {
    clearTimeout(nextScheduledRun);
    isStopped = false;
    nextScheduledRun = null;

    var run = function run() {
      clearTimeout(nextScheduledRun);
      takeOneMeasurement(function (measures) {
        if (!isStopped) {
          nextScheduledRun = (0, _setTimeout2["default"])(run, interval);
        }

        if (measures && onMeasures) {
          // onMeasures might be heavy, so we schedule it in its own queue
          (0, _setTimeout2["default"])(function () {
            return onMeasures(measures);
          }, 0);
        }
      });
    };

    navigatorConnection.onchange = run;
    run();
  };

  var stopMeasuring = function stopMeasuring() {
    clearTimeout(nextScheduledRun);
    isStopped = true;
    nextScheduledRun = null;

    navigatorConnection.onchange = function () {
      return null;
    };
  }; // Logging


  var logger = new _Logger["default"]();

  var logError = function logError(error) {
    console.warn('Streaming Agent', error);
    logger.error('Streaming Agent', error);
  }; // Actually take the measurement


  var takeOneMeasurement = function takeOneMeasurement(callback) {
    return (0, _deviceInfo.getDeviceInfo)(apiEndpoint).then(function (deviceInfo) {
      return _networkConnectivity["default"].measure(apiEndpoint, deviceInfo.recommendation).then(function (networkConnectivityInfo) {
        return {
          networkConnectivityInfo: networkConnectivityInfo,
          deviceInfo: deviceInfo
        };
      });
    }).then(function (_ref2) {
      var networkConnectivityInfo = _ref2.networkConnectivityInfo,
          deviceInfo = _ref2.deviceInfo;
      console.info('networkConnectivityInfo', networkConnectivityInfo);
      (0, _deviceInfo.updateDeviceInfo)(apiEndpoint, {
        rttRegionMeasurements: networkConnectivityInfo.rttStatsByRegionByTurn
      });
      callback({
        networkConnectivityInfo: networkConnectivityInfo,
        deviceInfo: deviceInfo
      });
    })["catch"](function (err) {
      logError(err);
      callback(null);
    });
  }; // This function is used only by Creek


  var changeApiEndpoint = function changeApiEndpoint(newEndpoint) {
    return apiEndpoint = newEndpoint;
  };

  return {
    startMeasuring: startMeasuring,
    stopMeasuring: stopMeasuring,
    changeApiEndpoint: changeApiEndpoint
  };
}