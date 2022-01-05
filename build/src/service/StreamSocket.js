"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _url = _interopRequireDefault(require("url"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _socket = _interopRequireDefault(require("socket.io-client"));

var _pako = _interopRequireDefault(require("pako"));

/**
 * Websocket connection and communicate with the backend
 */
class StreamSocket {
  /**
   * Returns Web Socket ping interval number in ms.
   * @return {number}
   */
  static get WEBSOCKET_PING_INTERVAL() {
    return 250;
  }

  static get WEBSOCKET_EMIT_REPORTS_INTERVAL() {
    return StreamSocket.WEBSOCKET_PING_INTERVAL * 10;
  }
  /**
   * @param {string} edgeNodeId
   * @param {string} streamEndpoint
   * @param {string} userId
   * @param {boolean} internalSession
   */


  constructor(edgeNodeId, streamEndpoint, userId, internalSession) {
    var _this = this;

    this.onReportMeasurement = payload => {
      payload.type = 'report';
      payload.timestamp = Date.now();
      this.reportCache.push(JSON.stringify(payload));
    };

    this.emitReports = function () {
      let isLast = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (isLast) {
        clearInterval(_this.reportTimer);
      }

      if (_this.reportCache.length && _this.socket) {
        _this.socket.emit('message', JSON.stringify({
          type: 'report-bundle',
          timestamp: Date.now(),
          reports: Array.from(_pako.default.deflate(JSON.stringify([..._this.reportCache])))
        }));

        _this.reportCache = [];
      }
    };

    this.onUserEventReport = payload => {
      payload.type = 'report-user-event';
      payload.timestamp = Date.now();

      if (this.socket) {
        this.socket.emit('message', JSON.stringify(payload));
      }
    };

    this.close = () => {
      if (this.socket) {
        this.emitReports(true);
        this.socket.close();

        _StreamingEvent.default.edgeNode(this.edgeNodeId).off(_StreamingEvent.default.REPORT_MEASUREMENT, this.onReportMeasurement).off(_StreamingEvent.default.USER_EVENT_REPORT, this.onUserEventReport).off(_StreamingEvent.default.STREAM_UNREACHABLE, this.close);

        this.socket = undefined;
      }
    };

    const endpoint = _url.default.parse(streamEndpoint);

    this.edgeNodeId = edgeNodeId;
    this.userId = userId;
    this.socket = (0, _socket.default)("".concat(endpoint.protocol, "//").concat(endpoint.host), {
      path: "".concat(endpoint.path, "/emulator-commands/socket.io"),
      query: "userId=".concat(userId, "&internal=").concat(internalSession ? '1' : '0')
    });
    this.reportCache = [];
    this.reportTimer = setInterval(this.emitReports, StreamSocket.WEBSOCKET_EMIT_REPORTS_INTERVAL); // Web Socket errors

    this.socket.on('error', err => _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.ERROR, err)); // Preforming and emit RTT to the streaming event bus.

    this.socket.on('pong', networkRoundTripTime => {
      _StreamingEvent.default.edgeNode(edgeNodeId).emit(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, networkRoundTripTime);
    });
    this.socket.on('message', data => {
      const message = JSON.parse(data);

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

}

exports.default = StreamSocket;