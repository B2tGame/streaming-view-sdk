"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _assert = _interopRequireDefault(require("assert"));

var _axios = _interopRequireDefault(require("axios"));

var _proxyquire = _interopRequireDefault(require("proxyquire"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _StreamWebRtc = _interopRequireDefault(require("./StreamWebRtc"));

// This makes copies of the module to be tested, each copy can be generated with different mocks
var makeNetworkConnectivity = function makeNetworkConnectivity(mocks) {
  return _proxyquire.default.noCallThru()('./networkConnectivity', mocks).default;
}; // Mock for axios.get


var axiosGetMock = function axiosGetMock(urlToResponse) {
  return function (url, options) {
    return new _promise.default(function (resolve) {
      return setTimeout(function () {
        return resolve(urlToResponse(url));
      }, 1);
    });
  };
}; // Mock for StreamWebRtc
// (we don't want to extend the original StreamWebRtc class, otherwise we risk unwittingly executing non-mocked methods)


var StreamWebRtcMock = /*#__PURE__*/function () {
  function StreamWebRtcMock() {
    (0, _classCallCheck2.default)(this, StreamWebRtcMock);
  }

  (0, _createClass2.default)(StreamWebRtcMock, [{
    key: "on",
    value: function on(eventName, callback) {
      switch (eventName) {
        case _StreamingEvent.default.WEBRTC_CLIENT_CONNECTED:
          setTimeout(callback, 10);
          break;

        case _StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT:
          setTimeout(function () {
            return callback(230);
          }, 30);
          setTimeout(function () {
            return callback(180);
          }, 100);
          break;

        default:
          throw new Error("Unknown event name: ".concat(eventName));
      }

      return this;
    }
  }, {
    key: "off",
    value: function off(eventName, callback) {
      return this;
    }
  }, {
    key: "close",
    value: function close() {}
  }]);
  return StreamWebRtcMock;
}();

StreamWebRtcMock.calculateRoundTripTimeStats = _StreamWebRtc.default.calculateRoundTripTimeStats;
var mockEndpoint = 'mockEndpoint';
var mockRecommendedEdges = [{
  edgeRegion: 'pa-papuasia-1',
  measurementEndpoints: ['papuasia-host-1', 'papuasia-host-2', 'papuasia-host-3']
}, {
  edgeRegion: 'mo-cornwall-0',
  measurementEndpoints: ['cornwall-host-1', 'cornwall-host-2']
}];
describe('networkConnectivity', function () {
  describe('measure', function () {
    before(function () {});
    it('measure', /*#__PURE__*/(0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
      var networkConnectivity, expected, actual;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              networkConnectivity = makeNetworkConnectivity({
                axios: {
                  get: axiosGetMock(function (url) {
                    return {
                      data: mockRecommendedEdges
                    };
                  })
                },
                '../service/StreamWebRtc': StreamWebRtcMock
              });
              expected = {
                predictedGameExperience: undefined,
                recommendedRegion: 'pa-papuasia-1',
                rttStatsByRegionByTurn: {
                  'pa-papuasia-1': {
                    0: {
                      rtt: 205,
                      stdDev: 25
                    },
                    1: {
                      rtt: 205,
                      stdDev: 25
                    }
                  },
                  'mo-cornwall-0': {
                    0: {
                      rtt: 205,
                      stdDev: 25
                    },
                    1: {
                      rtt: 205,
                      stdDev: 25
                    }
                  }
                }
              };
              _context.next = 4;
              return networkConnectivity.measure(mockEndpoint, mockRecommendedEdges);

            case 4:
              actual = _context.sent;

              _assert.default.deepStrictEqual(actual, expected);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })));
  });
});