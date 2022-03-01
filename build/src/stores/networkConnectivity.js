"use strict";

var _Object$keys = require("@babel/runtime-corejs3/core-js-stable/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/for-each");

var _Object$getOwnPropertyDescriptors = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js-stable/object/define-properties");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.resetNetworkConnectivity = exports.measureNetworkConnectivity = exports.getNetworkConnectivity = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/entries"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/defineProperty"));

var _deviceInfo = require("./deviceInfo");

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _StreamWebRtc = _interopRequireDefault(require("../service/StreamWebRtc"));

var _Measurement = _interopRequireDefault(require("../service/Measurement"));

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var _context6, _context7; var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? _forEachInstanceProperty(_context6 = ownKeys(Object(source), !0)).call(_context6, function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : _forEachInstanceProperty(_context7 = ownKeys(Object(source))).call(_context7, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }

var MEASUREMENT_LEVEL_BROWSER = 'browser-measurement';
var MEASUREMENT_LEVEL_BASIC = 'basic';
var MEASUREMENT_LEVEL_ADVANCED = 'advanced';
var MAX_RECOMMENDATION_COUNT = 3;
var DELAY_DEVICE_INFO_MS = 3000;
var WEBRTC_TIME_TO_CONNECTED = 5000;
var ADVANCED_MEASUREMENT_TIMEOUT = 5000;
var defaultNetworkConnectivity = {
  roundTripTime: undefined,
  downloadSpeed: undefined,
  recommendedRegion: undefined,
  rttRegionMeasurements: undefined,
  measurementLevel: undefined
};

var networkConnectivity = _objectSpread({}, defaultNetworkConnectivity);

var webrtcRoundTripTimeValuesMulti = {};
var webrtcRoundTripTimeStatsMulti = {};
var predictedGameExperienceMulti = {};
/**
 * Reset all network connectivity data
 */

var resetNetworkConnectivity = function resetNetworkConnectivity() {
  networkConnectivity = _objectSpread({}, defaultNetworkConnectivity);
};
/**
 * @param downloadSpeed
 * @returns {undefined|number}
 */


exports.resetNetworkConnectivity = resetNetworkConnectivity;

var convertMbitToBytes = function convertMbitToBytes(downloadSpeed) {
  if (downloadSpeed) {
    return downloadSpeed * 1024 * 1024 / 8;
  }

  return undefined;
};
/**
 * Get Browser measurement attributes
 * @param browserConnection NetworkInformation from the browser
 * @return {Promise<{roundTripTime: number|undefined, downloadSpeed: number|undefined, measurementLevel: string|undefined}>}
 */


var getBrowserMeasurement = function getBrowserMeasurement() {
  var browserConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
  var connection = browserConnection ? browserConnection : navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  return _promise["default"].resolve({
    roundTripTime: connection.rtt,
    downloadSpeed: convertMbitToBytes(connection.downlink),
    measurementLevel: MEASUREMENT_LEVEL_BROWSER
  });
};
/**
 * Get Basic measurement attributes, designed to be used in getBrowserMeasurement.
 * @return {Promise<{measurementLevel: string, recommendedRegion}>}
 */


var getBasicMeasurement = function getBasicMeasurement() {
  return (0, _deviceInfo.getDeviceInfo)().then(function (deviceInfo) {
    var _context;

    return {
      recommendedRegion: ((0, _find["default"])(_context = (deviceInfo || {}).recommendation || []).call(_context, function () {
        return true;
      }) || {}).edgeRegion,
      measurementLevel: MEASUREMENT_LEVEL_BASIC
    };
  });
};
/**
 * Get Advanced measurement attributes, designed to be used in getBrowserMeasurement.
 * @return {Promise<{measurementLevel: string, downloadSpeed: any}>}
 */


var getAdvancedMeasurement = function getAdvancedMeasurement() {
  /**
   * Recursive function to manage download speed measurement and fallback case.
   * @param {[]} recommendation Array of possible recommendations
   * @param {{}} iceServers Ice server options
   * @return {Promise<boolean>}
   */
  var connectionManagerMultiRegion = function connectionManagerMultiRegion(recommendation, iceServers) {
    var countRecommendation = 0;

    for (var i = 0; i < recommendation.length; ++i) {
      countRecommendation += recommendation[i].measurementEndpoints.length || 0;
    }

    if (countRecommendation === 0) {
      return _promise["default"].resolve(false);
    }

    var selectedEdges = [];

    for (var _i = 0; _i < recommendation.length && selectedEdges.length < MAX_RECOMMENDATION_COUNT; ++_i) {
      if (recommendation[_i].measurementEndpoints.length) {
        var _context2;

        selectedEdges.push({
          baseUrls: (0, _slice["default"])(_context2 = recommendation[_i].measurementEndpoints).call(_context2, 0, MAX_RECOMMENDATION_COUNT),
          region: recommendation[_i].edgeRegion,
          iceServers: iceServers
        });
      }
    }

    return webrtcManagerMultiRegion(selectedEdges).then(function (webrtcManagerSuccessful) {
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


  var getWebRtcMeasurement = function getWebRtcMeasurement(edge) {
    var _context3, _context4;

    console.log('getWebRtcMeasurement EDGE:', edge);

    if (edge.baseUrls.length === 0) {
      return _promise["default"].resolve(false);
    }

    var webRtcHost = "".concat(edge.baseUrls.shift(), "/webrtc");
    console.log('DEBUG - webRtcHost:', webRtcHost);
    console.log((0, _concat["default"])(_context3 = (0, _concat["default"])(_context4 = "WebRtc connect attempt: ".concat(webRtcHost, " region:")).call(_context4, edge.region, ", TURN:")).call(_context3, edge.iceServers.name));
    return new _promise["default"](function (resolve, reject) {
      var streamWebRtc = undefined;

      var onWebRtcClientConnected = function onWebRtcClientConnected() {
        var _context5;

        console.log((0, _concat["default"])(_context5 = "WebRtc connected to: ".concat(edge.region, ", TURN: ")).call(_context5, edge.iceServers.name));

        if (webrtcRoundTripTimeValuesMulti[edge.region] === undefined) {
          webrtcRoundTripTimeValuesMulti[edge.region] = {};
        }

        if (webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name] === undefined) {
          webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name] = [];
        }

        (0, _setTimeout2["default"])(function () {
          return stopMeasurement();
        }, ADVANCED_MEASUREMENT_TIMEOUT);
      };

      var onWebRtcRoundTripTimeMeasurement = function onWebRtcRoundTripTimeMeasurement(webrtcRtt) {
        webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name].push(webrtcRtt);
        predictedGameExperienceMulti[edge.region] = _Measurement["default"].calculatePredictedGameExperience(webrtcRtt, 0, edge.region)[_Measurement["default"].PREDICTED_GAME_EXPERIENCE_DEFAULT];
      };

      var stopMeasurement = function stopMeasurement() {
        var closeAction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

        if (((webrtcRoundTripTimeValuesMulti[edge.region] || {})[edge.iceServers.name] || []).length > 0) {
          if (webrtcRoundTripTimeStatsMulti[edge.region] === undefined) {
            webrtcRoundTripTimeStatsMulti[edge.region] = {};
          }

          webrtcRoundTripTimeStatsMulti[edge.region][edge.iceServers.name] = _StreamWebRtc["default"].calculateRoundTripTimeStats(webrtcRoundTripTimeValuesMulti[edge.region][edge.iceServers.name]);
        }

        streamWebRtc.off(_StreamingEvent["default"].WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected).off(_StreamingEvent["default"].WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement).close();

        if (closeAction) {
          closeAction();
        } else {
          resolve(((webrtcRoundTripTimeValuesMulti[edge.region] || {})[edge.iceServers.name] || []).length > 0);
        }
      };

      try {
        streamWebRtc = new _StreamWebRtc["default"](webRtcHost, edge.iceServers);
        (0, _setTimeout2["default"])(function () {
          return stopMeasurement();
        }, WEBRTC_TIME_TO_CONNECTED);
        streamWebRtc.on(_StreamingEvent["default"].WEBRTC_CLIENT_CONNECTED, onWebRtcClientConnected).on(_StreamingEvent["default"].WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onWebRtcRoundTripTimeMeasurement);
      } catch (e) {
        stopMeasurement(function () {
          return reject(false);
        });
      }
    }).then(function (result) {
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


  var webrtcManagerMultiRegion = function webrtcManagerMultiRegion(selectedEdges) {
    return _promise["default"].all((0, _reduce["default"])(selectedEdges).call(selectedEdges, function (acc, edge) {
      for (var _i2 = 0, _Object$entries = (0, _entries["default"])(edge.iceServers); _i2 < _Object$entries.length; _i2++) {
        var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i2], 2),
            key = _Object$entries$_i[0],
            iceCandidates = _Object$entries$_i[1];

        var edgeToMeasure = _objectSpread(_objectSpread({}, edge), {}, {
          iceServers: {
            name: key,
            candidates: iceCandidates
          }
        });

        acc.push(getWebRtcMeasurement(JSON.parse((0, _stringify["default"])(edgeToMeasure))));
      }

      return acc;
    }, [])).then(function (successful) {
      for (var success in successful) {
        if (success) {
          return true;
        }
      }

      return false;
    });
  };

  return (0, _deviceInfo.getDeviceInfo)().then(function (deviceInfo) {
    console.log('DeviceInfo:', deviceInfo);
    var recommendation = (deviceInfo || {}).recommendation || [];
    var iceServers = (deviceInfo || {}).iceServers || {};
    return connectionManagerMultiRegion(recommendation, iceServers);
  }).then(function () {
    var minRtt = undefined;
    var finalResult = {};

    for (var _i3 = 0, _Object$entries3 = (0, _entries["default"])(webrtcRoundTripTimeStatsMulti); _i3 < _Object$entries3.length; _i3++) {
      var _Object$entries3$_i = (0, _slicedToArray2["default"])(_Object$entries3[_i3], 2),
          region = _Object$entries3$_i[0],
          turns = _Object$entries3$_i[1];

      for (var _i4 = 0, _Object$entries4 = (0, _entries["default"])(turns); _i4 < _Object$entries4.length; _i4++) {
        var _Object$entries4$_i = (0, _slicedToArray2["default"])(_Object$entries4[_i4], 2),
            turn = _Object$entries4$_i[0],
            stats = _Object$entries4$_i[1];

        if (minRtt === undefined || minRtt > stats.rtt) {
          minRtt = stats.rtt;
          networkConnectivity.recommendedRegion = region;
        }

        if (finalResult[region] === undefined) {
          finalResult[region] = {};
        }

        finalResult[region][turn] = {
          rtt: _Measurement["default"].roundToDecimals(stats.rtt, 0),
          stdDev: _Measurement["default"].roundToDecimals(stats.standardDeviation, 0)
        };
      }
    }

    networkConnectivity.rttRegionMeasurements = finalResult;
  }).then(function () {
    return (0, _deviceInfo.updateDeviceInfo)(null, {
      rttRegionMeasurements: networkConnectivity.rttRegionMeasurements
    });
  }).then(function () {
    return {
      predictedGameExperience: predictedGameExperienceMulti[networkConnectivity.recommendedRegion],
      measurementLevel: MEASUREMENT_LEVEL_ADVANCED
    };
  });
};
/**
 * Measure network connectivity on different levels
 *
 * @param browserConnection NetworkInformation from the browser
 * @param measureWebrtcRtt
 * @return {Promise<{measurementLevel: undefined, downloadSpeed: undefined, recommendedRegion: undefined, rttRegionMeasurements: undefined, roundTripTime: undefined}>}
 */


var measureNetworkConnectivity = function measureNetworkConnectivity() {
  var browserConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
  var measureWebrtcRtt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return getBrowserMeasurement(browserConnection).then(function (browserMeasurement) {
    networkConnectivity = _objectSpread(_objectSpread({}, networkConnectivity), browserMeasurement);
  }).then(function () {
    return getBasicMeasurement();
  }).then(function (basicMeasurement) {
    networkConnectivity = _objectSpread(_objectSpread({}, networkConnectivity), basicMeasurement);
  }).then(function () {
    return measureWebrtcRtt ? new _promise["default"](function (resolve) {
      return (0, _setTimeout2["default"])(function () {
        return resolve(getAdvancedMeasurement());
      }, DELAY_DEVICE_INFO_MS);
    } // delay the execution
    ) : _promise["default"].resolve({});
  }).then(function (advancedMeasurement) {
    networkConnectivity = _objectSpread(_objectSpread({}, networkConnectivity), advancedMeasurement);
    console.log('networkConnectivity:', networkConnectivity);
    console.log('rttRegionMeasurements:', networkConnectivity.rttRegionMeasurements);
  }).then(function () {
    return networkConnectivity;
  });
};
/**
 * Gets the actual state of network connectivity information
 *
 * @param browserConnection
 * @return {Promise<{measurementLevel: (string|undefined), downloadSpeed: (number|undefined), recommendedRegion: (string|undefined), rttRegionMeasurements: (string[]|undefined), roundTripTime: (number|undefined)}>}
 */


exports.measureNetworkConnectivity = measureNetworkConnectivity;

var getNetworkConnectivity = function getNetworkConnectivity() {
  var browserConnection = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
  return _promise["default"].resolve().then(function () {
    if (networkConnectivity.measurementLevel === undefined) {
      return getBrowserMeasurement(browserConnection);
    }

    return networkConnectivity;
  });
};

exports.getNetworkConnectivity = getNetworkConnectivity;