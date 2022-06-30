"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/from"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _socket = _interopRequireDefault(require("socket.io-client"));

var _urlParse = _interopRequireDefault(require("url-parse"));

var _pako = _interopRequireDefault(require("pako"));

/**
 * Websocket connection and communicate with the backend
 */
var StreamSocket = /*#__PURE__*/function () {
  /**
   * @param {string} edgeNodeId
   * @param {string} streamEndpoint
   * @param {string} userId
   * @param {boolean} internalSession
   */
  function StreamSocket(edgeNodeId, streamEndpoint, userId, internalSession) {
    var _this = this,
        _context,
        _context2;

    (0, _classCallCheck2.default)(this, StreamSocket);

    this.onReportMeasurement = function (payload) {
      payload.type = 'report';
      payload.timestamp = Date.now();

      _this.reportCache.push((0, _stringify.default)(payload));
    };

    this.emitReports = function () {
      var isLast = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (isLast) {
        clearInterval(_this.reportTimer);
      }

      if (_this.reportCache.length && _this.socket) {
        _this.socket.emit('message', (0, _stringify.default)({
          type: 'report-bundle',
          timestamp: Date.now(),
          reports: (0, _from.default)(_pako.default.deflate((0, _stringify.default)((0, _toConsumableArray2.default)(_this.reportCache))))
        }));

        _this.reportCache = [];
      }
    };

    this.onUserEventReport = function (payload) {
      payload.type = 'report-user-event';
      payload.timestamp = Date.now();

      if (_this.socket) {
        _this.socket.emit('message', (0, _stringify.default)(payload));
      }
    };

    this.close = function () {
      if (_this.socket) {
        _this.emitReports(true);

        _this.socket.close();

        _StreamingEvent.default.edgeNode(_this.edgeNodeId).off(_StreamingEvent.default.REPORT_MEASUREMENT, _this.onReportMeasurement).off(_StreamingEvent.default.USER_EVENT_REPORT, _this.onUserEventReport).off(_StreamingEvent.default.STREAM_UNREACHABLE, _this.close);

        _this.socket = undefined;
      }
    };

    var endpoint = (0, _urlParse.default)(streamEndpoint);
    this.edgeNodeId = edgeNodeId;
    this.userId = userId;
    this.socket = (0, _socket.default)((0, _concat.default)(_context = "".concat(endpoint.protocol, "//")).call(_context, endpoint.host), {
      path: "".concat(endpoint.pathname, "/emulator-commands/socket.io"),
      query: (0, _concat.default)(_context2 = "userId=".concat(userId, "&internal=")).call(_context2, internalSession ? '1' : '0')
    });
    this.reportCache = [];
    this.reportTimer = setInterval(this.emitReports, StreamSocket.WEBSOCKET_EMIT_REPORTS_INTERVAL); // Web Socket errors

    this.socket.on('error', function (err) {
      return _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.ERROR, err);
    }); // Preforming and emit RTT to the streaming event bus.

    this.socket.on('pong', function (networkRoundTripTime) {
      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, networkRoundTripTime);
    });
    this.socket.on('message', function (data) {
      var message = JSON.parse(data);

      if (message.name === 'emulator-configuration') {
        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.EMULATOR_CONFIGURATION, message.configuration);
      } else if (message.name === 'emulator-event') {
        switch (message.event) {
          case 'paused':
            {
              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_PAUSED);

              break;
            }

          case 'resumed':
            {
              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_RESUMED);

              break;
            }

          case 'terminated':
            {
              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_UNREACHABLE, 'Edge node status change: terminated');

              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_TERMINATED);

              break;
            }

          case 'edge-node-crashed':
            {
              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_UNREACHABLE, 'Edge node status change: edge-node-crashed');

              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.EDGE_NODE_CRASHED);

              _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_TERMINATED);

              break;
            }

          default:
            {// Unexpected value
            }
        }
      } else if (message.name === 'moment-detector-event') {
        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.MOMENT_DETECTOR_EVENT, message.payload || {});
      } else if (message.name === 'emulator-stream' && message.ready) {
        _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.STREAM_EMULATOR_READY);
      }
    }); // Send measurement report to the backend.

    _StreamingEvent.default.edgeNode(edgeNodeId).on(_StreamingEvent.default.REPORT_MEASUREMENT, this.onReportMeasurement).on(_StreamingEvent.default.USER_EVENT_REPORT, this.onUserEventReport).on(_StreamingEvent.default.STREAM_UNREACHABLE, this.close);
  }

  (0, _createClass2.default)(StreamSocket, null, [{
    key: "WEBSOCKET_PING_INTERVAL",
    get:
    /**
     * Returns Web Socket ping interval number in ms.
     * @return {number}
     */
    function get() {
      return 250;
    }
  }, {
    key: "WEBSOCKET_EMIT_REPORTS_INTERVAL",
    get: function get() {
      return StreamSocket.WEBSOCKET_PING_INTERVAL * 10;
    }
  }]);
  return StreamSocket;
}();

exports.default = StreamSocket;