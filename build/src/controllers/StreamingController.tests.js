"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _assert = _interopRequireDefault(require("assert"));

var _proxyquire = _interopRequireDefault(require("proxyquire"));

var moduleToBeTested = './StreamingController'; //
// This makes copies of the module to be tested, each copy can be generated with different mocks
//

var makeModule = function makeModule(mocks) {
  return _proxyquire.default.noCallThru()(moduleToBeTested, mocks).default;
}; //
// Mocks
//


var axiosGetMock = function axiosGetMock(urlToResponse) {
  return function (url, options) {
    return new _promise.default(function (resolve) {
      return setTimeout(function () {
        return resolve(urlToResponse(url));
      }, 1);
    });
  };
};

var measuresMock = {
  connectivityInfo: 'FakeConnectivityInfoPayload',
  deviceInfo: 'FakeDeviceInfoPayload'
}; //
// Tests
//

describe('StreamingController', function () {
  describe('getPredictedGameExperiences', function () {
    // This is needed by measurementScheduler
    global.navigator = {};
    var lastMeasure = null;

    var buildStreamingController = function buildStreamingController() {
      return makeModule({
        axios: {
          get: axiosGetMock(function (url) {
            return {
              data: {
                apps: ['app1', 'app2']
              }
            };
          })
        }
      })({
        apiEndpoint: 'https://fake.meh',
        measurementScheduler: {
          getLastMeasure: function getLastMeasure() {
            return lastMeasure;
          },
          changeApiEndpoint: function changeApiEndpoint() {
            return null;
          },
          startMeasuring: function startMeasuring() {
            return null;
          },
          stopMeasuring: function stopMeasuring() {
            return null;
          }
        }
      });
    };

    it('responds quickly when connectivity measures are available', /*#__PURE__*/(0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
      var sc, result;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              lastMeasure = measuresMock;
              _context.next = 3;
              return buildStreamingController();

            case 3:
              sc = _context.sent;
              _context.next = 6;
              return sc.getPredictedGameExperiences(1000 * 1000);

            case 6:
              result = _context.sent;

              _assert.default.deepEqual(result, {
                apps: ['app1', 'app2']
              });

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })));
    it('polls when connectivity measures are NOT available', /*#__PURE__*/(0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2() {
      var sc, result;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              lastMeasure = null;
              _context2.next = 3;
              return buildStreamingController();

            case 3:
              sc = _context2.sent;
              // lastMeasure will actually become available only after a while
              setTimeout(function () {
                lastMeasure = measuresMock;
              }, 200); // This time we set a pollingTime much lower than the delay above

              _context2.next = 7;
              return sc.getPredictedGameExperiences(10);

            case 7:
              result = _context2.sent;

              _assert.default.deepEqual(result, {
                apps: ['app1', 'app2']
              });

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    })));
  });
});