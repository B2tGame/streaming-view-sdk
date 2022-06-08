"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _url = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/url"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/starts-with"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/date/now"));

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _axios = _interopRequireDefault(require("axios"));

var _deviceInfo = require("./service/deviceInfo");

var _measurementScheduler = _interopRequireDefault(require("./measurementScheduler"));

var _StreamingEvent = _interopRequireDefault(require("./StreamingEvent"));

var _buildInfo = _interopRequireDefault(require("./build-info.json"));

var measurementScheduler = null;
var latestMeasurement = null;
/**
 * StreamingController is responsible to poll and terminate the edge node.
 *
 * @class StreamingController
 */

var StreamingController = /*#__PURE__*/function () {
  /**
   *
   * @param {object} props
   * @param {string} props.apiEndpoint
   * @param {string} props.edgeNodeId Optional parameters, require for some of the API.
   * @param {string} props.internalSession Optional parameter for flagging if the session is internal.
   */
  function StreamingController(props) {
    (0, _classCallCheck2["default"])(this, StreamingController);

    if (!props.apiEndpoint) {
      throw new Error('StreamingController: Missing apiEndpoint');
    }

    try {
      new _url["default"](props.apiEndpoint);
    } catch (err) {
      throw new Error("StreamingController: invalid apiEndpoint, got \"".concat(props.apiEndpoint, "\" as input"));
    }

    this.apiEndpoint = props.apiEndpoint;
    this.edgeNodeId = props.edgeNodeId || undefined;
    this.internalSession = props.internalSession || false;

    if (measurementScheduler) {
      measurementScheduler.changeApiEndpoint(props.apiEndpoint);
    } else {
      this.constructor.startMeasurementScheduler({
        apiEndpoint: props.apiEndpoint,
        interval: 30 * 1000
      });
    }
  }
  /**
   * Get the edge node id.
   * @returns {Promise<string>} Resolve Edge Node ID or reject with an error if no edge node ID was provided.
   */


  (0, _createClass2["default"])(StreamingController, [{
    key: "getEdgeNodeId",
    value: function getEdgeNodeId() {
      return this.edgeNodeId !== undefined ? _promise["default"].resolve(this.edgeNodeId) : _promise["default"].reject(new Error('StreamingController: Missing edgeNodeId, API endpoint unsupported without Edge Node ID.'));
    }
    /**
     * Terminate the instance
     * @returns {Promise<*>}
     */

  }, {
    key: "terminate",
    value: function terminate() {
      return this.getStreamEndpoint().then(function (streamEndpoint) {
        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/terminate"));
      });
    }
    /**
     * Backup the current state
     * @returns {Promise<*>}
     */

  }, {
    key: "backup",
    value: function backup() {
      return this.getStreamEndpoint().then(function (streamEndpoint) {
        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/backup"));
      }).then(function (resp) {
        var _context;

        if ((0, _startsWith["default"])(_context = resp.data.toString()).call(_context, 'FAIL')) {
          throw new Error(resp.data.toString());
        } else {
          return resp.data;
        }
      });
    }
    /**
     * Creates a game snapshot
     * @returns {Promise<string>}
     */

  }, {
    key: "createGameSnapshot",
    value: function createGameSnapshot() {
      return this.save();
    }
    /**
     * Get a list of predicted game experiences for all apps based on the current usage connectivity.
     * @returns {Promise<[{appId: number, score: number}]>}
     */

  }, {
    key: "getPredictedGameExperiences",
    value: function getPredictedGameExperiences() {
      return _promise["default"].all([this.getApiEndpoint(), this.getConnectivityInfo(), this.getDeviceInfo()]).then(function (_ref) {
        var _context2, _context3;

        var _ref2 = (0, _slicedToArray2["default"])(_ref, 3),
            apiEndpoint = _ref2[0],
            connectivityInfo = _ref2[1],
            deviceInfo = _ref2[2];

        return _promise["default"].all([connectivityInfo, _axios["default"].get((0, _concat["default"])(_context2 = (0, _concat["default"])(_context3 = "".concat(apiEndpoint, "/api/streaming-games/predicted-game-experience?connectivity-info=")).call(_context3, encodeURIComponent((0, _stringify["default"])(connectivityInfo)), "\n          &deviceInfoId=")).call(_context2, encodeURIComponent(deviceInfo.deviceInfoId)))]);
      }).then(function (_ref3) {
        var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
            connectivityInfo = _ref4[0],
            result = _ref4[1];

        return {
          apps: (result.data || {}).apps || [],
          measurementLevel: connectivityInfo.measurementLevel
        };
      });
    }
    /**
     * Sends the save command to the supervisor.
     * This is used to trigger different save behaviour depending on edgenode mode.
     * Snapshot mode: saves a snapshot
     * Apk-image mode: saves an apk image
     * Base-image mode: saves a base image definition
     * @returns {Promise<string>}
     */

  }, {
    key: "save",
    value: function save() {
      return this.getStreamEndpoint().then(function (streamEndpoint) {
        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/save"));
      }).then(function (resp) {
        var _context4;

        if ((0, _startsWith["default"])(_context4 = resp.data.toString()).call(_context4, 'FAIL')) {
          throw new Error(resp.data.toString());
        } else {
          return resp.data;
        }
      });
    }
    /**
     * Sends the pause command to the supervisor.
     * This is used to pause the emulator.
     * @returns {Promise<*>}
     */

  }, {
    key: "pause",
    value: function pause() {
      return _promise["default"].all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(function (_ref5) {
        var _ref6 = (0, _slicedToArray2["default"])(_ref5, 2),
            edgeNodeId = _ref6[0],
            streamEndpoint = _ref6[1];

        _StreamingEvent["default"].edgeNode(edgeNodeId).emit(_StreamingEvent["default"].LOG, {
          name: 'streaming-controller',
          action: 'pause'
        });

        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/pause"));
      });
    }
    /**
     * Resets the current moment.
     * @returns {Promise<*>}
     */

  }, {
    key: "resetMoment",
    value: function resetMoment() {
      return _promise["default"].all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(function (_ref7) {
        var _ref8 = (0, _slicedToArray2["default"])(_ref7, 2),
            edgeNodeId = _ref8[0],
            streamEndpoint = _ref8[1];

        _StreamingEvent["default"].edgeNode(edgeNodeId).emit(_StreamingEvent["default"].LOG, {
          name: 'streaming-controller',
          action: 'resetMoment'
        });

        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/reset")).then(function () {
          _StreamingEvent["default"].edgeNode(edgeNodeId).emit(_StreamingEvent["default"].STREAM_READY);
        });
      });
    }
    /**
     * Sends the pause command to the supervisor.
     * This is used to resume a paused emulator.
     * @returns {Promise<*>}
     */

  }, {
    key: "resume",
    value: function resume() {
      return _promise["default"].all([this.getEdgeNodeId(), this.getStreamEndpoint()]).then(function (_ref9) {
        var _ref10 = (0, _slicedToArray2["default"])(_ref9, 2),
            edgeNodeId = _ref10[0],
            streamEndpoint = _ref10[1];

        _StreamingEvent["default"].edgeNode(edgeNodeId).emit(_StreamingEvent["default"].LOG, {
          name: 'streaming-controller',
          action: 'resume'
        });

        return _axios["default"].get("".concat(streamEndpoint, "/emulator-commands/resume"));
      });
    }
    /**
     * Get the streaming endpoint
     * @return {Promise<string>}
     */

  }, {
    key: "getStreamEndpoint",
    value: function getStreamEndpoint() {
      return this.waitFor().then(function (status) {
        if (status.endpoint !== undefined) {
          return status.endpoint;
        } else {
          throw new Error("Can't resolve Stream Endpoint, got: " + (0, _stringify["default"])(status));
        }
      });
    }
    /**
     * Get API Endpoint
     * @returns {string}
     */

  }, {
    key: "getApiEndpoint",
    value: function getApiEndpoint() {
      return this.apiEndpoint;
    }
    /**
     * Determine if the session is internal.
     * @return {boolean}
     */

  }, {
    key: "isInternalSession",
    value: function isInternalSession() {
      return this.internalSession;
    }
    /**
     * Wait for the edge node to be ready before the promise will resolve.
     * @param {StreamingController.WAIT_FOR_READY|StreamingController.WAIT_FOR_ENDPOINT} waitFor Define the exit criteria for what to wait for.
     * @param {number} timeout Max duration the waitFor should wait before reject with an timeout exception.
     * @returns {Promise<{status: string, endpoint: string}>}
     */

  }, {
    key: "waitFor",
    value: function waitFor() {
      var _this = this;

      var _waitFor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : StreamingController.WAIT_FOR_READY;

      var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : StreamingController.DEFAULT_TIMEOUT;
      var isQueuedEventFire = false;
      /**
       * Get the status of the edge node.
       * @param {string} uri
       * @param {number} timeout
       * @returns {Promise<*>}
       */

      var getStatus = function getStatus(uri, timeout) {
        return _axios["default"].get(uri, {
          timeout: timeout
        }).then(function (result) {
          var stillWaiting = _waitFor === StreamingController.WAIT_FOR_READY && result.data.state === 'pending' || _waitFor === StreamingController.WAIT_FOR_ENDPOINT && result.data.endpoint === undefined;

          if (stillWaiting) {
            if (result.data.queued && !isQueuedEventFire) {
              isQueuedEventFire = true;

              if (_this.edgeNodeId) {
                _StreamingEvent["default"].edgeNode(_this.edgeNodeId).emit(_StreamingEvent["default"].SERVER_OUT_OF_CAPACITY);
              }
            }

            throw new Error('pending');
          } else {
            return result.data;
          }
        });
      };
      /**
       * Retry will try to execute the promise that the callback function returns
       * until resolved or runs out of maxRetry
       * @param {function: Promise<*>} callback
       * @param {number} maxTimeout
       */


      var retry = function retry(callback, maxTimeout) {
        var endTimestamp = (0, _now["default"])() + maxTimeout;
        return new _promise["default"](function (resolve, reject) {
          var fn = function fn() {
            callback().then(resolve, function (err) {
              var httpStatusCode = (err.response || {}).status || 500;

              if (httpStatusCode === 404) {
                resolve((err.response || {}).data || {});
              } else if (endTimestamp > (0, _now["default"])()) {
                (0, _setTimeout2["default"])(fn, 10);
              } else {
                reject(err);
              }
            });
          };

          fn();
        });
      };

      return this.getEdgeNodeId().then(function (edgeNodeId) {
        var internalSession = _this.isInternalSession() ? '&internal=1' : '';
        return retry(function () {
          var _context5, _context6;

          return getStatus((0, _concat["default"])(_context5 = (0, _concat["default"])(_context6 = "".concat(_this.getApiEndpoint(), "/api/streaming-games/status/")).call(_context6, edgeNodeId, "?wait=1")).call(_context5, internalSession), 5000);
        }, timeout);
      });
    }
    /**
     * Get device info from the device including geolocation, screen configuration etc.
     * @returns {Promise<object>}
     */

  }, {
    key: "getDeviceInfo",
    value: function getDeviceInfo() {
      return (latestMeasurement ? _promise["default"].resolve(latestMeasurement.deviceInfo) : (0, _deviceInfo.getDeviceInfo)(this.apiEndpoint)).then(function (deviceInfo) {
        return {
          deviceInfoId: deviceInfo.deviceInfoId,
          userId: deviceInfo.userId
        };
      });
    }
    /**
     * Get connectivity info
     * @returns {Promise<{}>}
     */

  }, {
    key: "getConnectivityInfo",
    value: function getConnectivityInfo() {
      // Per API specification https://docs.google.com/document/d/1VhVZxo2FkoHCF3c90sP-IJJl7WsDP4wQA7OT7IWXauY/edit#heading=h.rbmzojf3dehw
      // this method needs to return a Promise
      return _promise["default"].resolve(latestMeasurement ? latestMeasurement.networkConnectivityInfo : {});
    }
  }], [{
    key: "DEFAULT_TIMEOUT",
    get: function get() {
      return 30 * 60 * 1000; // 30 minute
    }
    /**
     * Get SDK Version
     * @returns {string}
     */

  }, {
    key: "SDK_VERSION",
    get: function get() {
      return _buildInfo["default"].tag;
    }
    /**
     * Wait until the edge node reach a ready state.
     */

  }, {
    key: "WAIT_FOR_READY",
    get: function get() {
      return 'ready';
    }
    /**
     * Wait until the edge node receiving an endpoint independent of the ready state.
     */

  }, {
    key: "WAIT_FOR_ENDPOINT",
    get: function get() {
      return 'endpoint';
    }
    /*
     * Streaming agent global
     */

  }, {
    key: "startMeasurementScheduler",
    value: function startMeasurementScheduler(_ref11) {
      var apiEndpoint = _ref11.apiEndpoint,
          interval = _ref11.interval;
      measurementScheduler && measurementScheduler.stopMeasuring();
      measurementScheduler = (0, _measurementScheduler["default"])({
        apiEndpoint: apiEndpoint,
        interval: Math.max(5000, +interval || 0),
        navigatorConnection: navigator.connection || navigator.mozConnection || navigator.webkitConnection || {},
        onMeasures: function onMeasures(streamingAgentPayload) {
          return latestMeasurement = streamingAgentPayload;
        }
      });
      measurementScheduler.startMeasuring();
    }
  }, {
    key: "onGameReady",
    value: function onGameReady() {
      measurementScheduler && measurementScheduler.stopMeasuring();
    }
  }, {
    key: "onGameTerminated",
    value: function onGameTerminated() {
      measurementScheduler && measurementScheduler.startMeasuring();
    }
  }]);
  return StreamingController;
}();
/**
 * Instantiating the StreamingController
 * @returns {Promise<StreamingController>}
 */
// The only reason we are using a factory that returns a promise rather than exposing directly the class is backwards-compatibility.


var factory = function factory(props) {
  return _promise["default"].resolve(props).then(function (props) {
    return new StreamingController(props);
  });
};

factory.EVENT_STREAM_CONNECTED = _StreamingEvent["default"].STREAM_CONNECTED;
factory.EVENT_SERVER_OUT_OF_CAPACITY = _StreamingEvent["default"].SERVER_OUT_OF_CAPACITY;
factory.EVENT_EMULATOR_CONFIGURATION = _StreamingEvent["default"].EMULATOR_CONFIGURATION;
factory.EVENT_STREAM_UNREACHABLE = _StreamingEvent["default"].STREAM_UNREACHABLE;
factory.EVENT_STREAM_PAUSED = _StreamingEvent["default"].STREAM_PAUSED;
factory.EVENT_STREAM_RESUMED = _StreamingEvent["default"].STREAM_RESUMED;
factory.EVENT_EDGE_NODE_CRASHED = _StreamingEvent["default"].EDGE_NODE_CRASHED;
factory.EVENT_REQUIRE_USER_PLAY_INTERACTION = _StreamingEvent["default"].REQUIRE_USER_PLAY_INTERACTION;
factory.SDK_VERSION = StreamingController.SDK_VERSION;
factory.EVENT_STREAM_READY = _StreamingEvent["default"].STREAM_READY;
factory.EVENT_MOMENT_DETECTOR_EVENT = _StreamingEvent["default"].MOMENT_DETECTOR_EVENT;
factory.EVENT_PREDICTED_GAME_EXPERIENCE = _StreamingEvent["default"].PREDICTED_GAME_EXPERIENCE;
factory.EVENT_STREAM_TERMINATED = _StreamingEvent["default"].STREAM_TERMINATED;
factory.WAIT_FOR_READY = StreamingController.WAIT_FOR_READY;
factory.WAIT_FOR_ENDPOINT = StreamingController.WAIT_FOR_ENDPOINT;
factory.onGameReady = StreamingController.onGameReady;
factory.onGameTerminated = StreamingController.onGameTerminated;
var _default = factory;
exports["default"] = _default;