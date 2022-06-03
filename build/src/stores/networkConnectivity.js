"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/entries"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _every = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/every"));

var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/for-each"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _axios = _interopRequireDefault(require("axios"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _StreamWebRtc = _interopRequireDefault(require("../service/StreamWebRtc"));

var _Measurement = _interopRequireDefault(require("../service/Measurement"));

var MAX_RECOMMENDATION_COUNT = 3;
var WEBRTC_TIME_TO_CONNECTED = 5000;
var ADVANCED_MEASUREMENT_TIMEOUT = 5000;

function asyncDoWhile(functionToRetry, shouldRetry) {
  return functionToRetry().then(function (result) {
    return shouldRetry(result) ? asyncDoWhile(functionToRetry, shouldRetry) : result;
  });
}
/**
 *
 * @param {string} apiEndpoint
 * @param {string} region
 * @returns {Promise<*>}
 */


var requestIceServers = function requestIceServers(apiEndpoint, region) {
  var _context;

  return _axios["default"].get((0, _concat["default"])(_context = "".concat(apiEndpoint, "/api/streaming-games/edge-node/ice-server/")).call(_context, region), {
    timeout: 2500
  }).then(function (result) {
    return result.data || {};
  });
};
/**
 * Collect RTT for a given region and turn
 *
 * @params {{turnName: string, region: string, webRtcHost: string, iceCandidates: *}}
 * @returns {Promise<Array<number>>}
 */


function getRTTMeasurements(_ref) {
  var turnName = _ref.turnName,
      region = _ref.region,
      webRtcHost = _ref.webRtcHost,
      iceCandidates = _ref.iceCandidates;
  return new _promise["default"](function (resolve) {
    var streamWebRtc = new _StreamWebRtc["default"](webRtcHost, {
      name: turnName,
      candidates: iceCandidates
    });
    var rttMeasurements = [];

    var onConnected = function onConnected() {
      var _context2;

      console.info((0, _concat["default"])(_context2 = "WebRtc connected to: ".concat(region, ", TURN: ")).call(_context2, turnName));
      (0, _setTimeout2["default"])(function () {
        return stopMeasurement();
      }, ADVANCED_MEASUREMENT_TIMEOUT);
    };

    var onMeasurement = function onMeasurement(rtt) {
      rttMeasurements.push(rtt);
    };

    var stopMeasurement = function stopMeasurement() {
      // This function will likely be called multiple times:
      //  * Closing the same streamWebRtc object multiple times should be fine
      //  * Calling resolve() multiple times should also be safe https://stackoverflow.com/questions/20328073/is-it-safe-to-resolve-a-promise-multiple-times
      streamWebRtc.off(_StreamingEvent["default"].WEBRTC_CLIENT_CONNECTED, onConnected).off(_StreamingEvent["default"].WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onMeasurement).close();
      resolve(rttMeasurements);
    };

    streamWebRtc.on(_StreamingEvent["default"].WEBRTC_CLIENT_CONNECTED, onConnected).on(_StreamingEvent["default"].WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, onMeasurement);
    (0, _setTimeout2["default"])(function () {
      return stopMeasurement();
    }, WEBRTC_TIME_TO_CONNECTED);
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
  return _promise["default"].all((0, _map["default"])(selectedEdges).call(selectedEdges, function (_ref2) {
    var edgeRegion = _ref2.edgeRegion,
        measurementEndpoints = _ref2.measurementEndpoints;
    return requestIceServers(apiEndpoint, edgeRegion).then(function (iceServers) {
      var _context3;

      return _promise["default"].all((0, _map["default"])(_context3 = (0, _entries["default"])(iceServers)).call(_context3, function (_ref3) {
        var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
            turnName = _ref4[0],
            iceCandidates = _ref4[1];

        return getRTTMeasurements({
          webRtcHost: "".concat(measurementEndpoints[iterationCounter % measurementEndpoints.length], "/webrtc"),
          region: edgeRegion,
          turnName: turnName,
          iceCandidates: iceCandidates
        }).then(function (rttMeasurements) {
          return {
            region: edgeRegion,
            turnName: turnName,
            rttMeasurements: rttMeasurements
          };
        });
      }));
    });
  })).then(function (perEdge) {
    var _ref5;

    return (0, _concat["default"])(_ref5 = []).apply(_ref5, (0, _toConsumableArray2["default"])(perEdge));
  });
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
  var _context4;

  var selectedEdges = (0, _slice["default"])(_context4 = (0, _filter["default"])(recommendedEdges).call(recommendedEdges, function (edge) {
    return edge.measurementEndpoints.length;
  })).call(_context4, 0, MAX_RECOMMENDATION_COUNT); // This is used so that at each iteration we can select, for each selectedEdge, a different measurementEndpoint

  var iterationCounter = 0;
  return asyncDoWhile(function () {
    return getRTTMeasurementsForEdgeRegions(apiEndpoint, selectedEdges, iterationCounter++);
  }, // keep trying until we have at least a turn with some measurements
  function (turnMeasurements) {
    return (0, _every["default"])(turnMeasurements).call(turnMeasurements, function (measurement) {
      return measurement.rttMeasurements.length === 0;
    });
  }).then(function (turnMeasurements) {
    var minSpeed = Infinity;
    var minRegion = null;
    var minRtts = null;
    var statsByRegionByTurn = {};
    (0, _forEach["default"])(turnMeasurements).call(turnMeasurements, function (_ref6) {
      var region = _ref6.region,
          turnName = _ref6.turnName,
          rttMeasurements = _ref6.rttMeasurements;

      if (rttMeasurements.length === 0) {
        return;
      }

      var stats = _StreamWebRtc["default"].calculateRoundTripTimeStats(rttMeasurements);

      statsByRegionByTurn[region] = statsByRegionByTurn[region] || {};
      statsByRegionByTurn[region][turnName] = stats;
      var delay = estimateSpeed(stats.rtt, stats.stdDev);

      if (minSpeed > delay) {
        minSpeed = delay;
        minRegion = region;
        minRtts = rttMeasurements;
      }
    }); // calculatePredictedGameExperience needs to build up its internal state, so we need to call it several times.
    // The value we want is the last it returns, all previous return values are discarded.

    var predictedGameExperience = (0, _reduce["default"])(minRtts).call(minRtts, function (rtt) {
      return _Measurement["default"].calculatePredictedGameExperience(rtt, 0, minRegion);
    })[_Measurement["default"].PREDICTED_GAME_EXPERIENCE_DEFAULT];

    return {
      predictedGameExperience: predictedGameExperience,
      recommendedRegion: minRegion,
      rttStatsByRegionByTurn: statsByRegionByTurn
    };
  });
}

var _default = {
  measure: measure
};
exports["default"] = _default;