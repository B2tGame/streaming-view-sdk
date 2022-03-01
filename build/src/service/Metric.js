"use strict";

var _sliceInstanceProperty = require("@babel/runtime-corejs3/core-js-stable/instance/slice");

var _Array$from = require("@babel/runtime-corejs3/core-js-stable/array/from");

var _Symbol = require("@babel/runtime-corejs3/core-js-stable/symbol");

var _getIteratorMethod = require("@babel/runtime-corejs3/core-js/get-iterator-method");

var _Array$isArray = require("@babel/runtime-corejs3/core-js-stable/array/is-array");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/date/now"));

var _isFinite = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/number/is-finite"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof _Symbol !== "undefined" && _getIteratorMethod(o) || o["@@iterator"]; if (!it) { if (_Array$isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { var _context5; if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = _sliceInstanceProperty(_context5 = Object.prototype.toString.call(o)).call(_context5, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return _Array$from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var Metric = /*#__PURE__*/function () {
  function Metric() {
    (0, _classCallCheck2["default"])(this, Metric);
    this.refTimestamp = undefined;
  }
  /**
   * Set the zero reference timestamp
   * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
   */


  (0, _createClass2["default"])(Metric, [{
    key: "setReferenceTime",
    value: function setReferenceTime() {
      var timestamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      this.refTimestamp = timestamp || (0, _now["default"])();
      this.metrics = {};

      var _iterator = _createForOfIteratorHelper(Metric.ALL_METRICS),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var item = _step.value;
          this.metrics[item.id] = {
            sum: 0,
            count: 0,
            raw: [],
            firstValueTime: undefined,
            lastValueTime: undefined
          };
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    /**
     * Get if reference time has been set or not.
     * @return {boolean}
     */

  }, {
    key: "hasReferenceTime",
    value: function hasReferenceTime() {
      return this.refTimestamp !== undefined;
    }
    /**
     * Get the current time against the reference time
     * @param timestamp
     * @return {number}
     */

  }, {
    key: "getReferenceTime",
    value: function getReferenceTime() {
      var timestamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      return (timestamp || (0, _now["default"])()) - this.refTimestamp;
    }
    /**
     * Inject a new value to the metric.
     * @param {number} value
     * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
     */

  }, {
    key: "inject",
    value: function inject(value) {
      var _this = this;

      var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if ((0, _isFinite["default"])(value) && this.refTimestamp !== undefined) {
        (function () {
          var currentTimestamp = _this.getReferenceTime(timestamp);

          var _iterator2 = _createForOfIteratorHelper(Metric.ALL_METRICS),
              _step2;

          try {
            var _loop = function _loop() {
              var item = _step2.value;

              if (item.mode === 'start') {
                if (item.start <= currentTimestamp && item.end >= currentTimestamp) {
                  var metric = _this.metrics[item.id];
                  metric.raw.push({
                    timestamp: currentTimestamp,
                    value: value
                  });
                  metric.firstValueTime = metric.firstValueTime === undefined ? currentTimestamp : metric.firstValueTime;
                  metric.lastValueTime = currentTimestamp;
                  metric.sum += value;
                  metric.count += 1;
                }
              } else if (item.mode === 'end') {
                var _context;

                var _metric = _this.metrics[item.id];

                _metric.raw.push({
                  timestamp: currentTimestamp,
                  value: value
                });

                _metric.raw = (0, _filter["default"])(_context = _metric.raw).call(_context, function (rec) {
                  return currentTimestamp - rec.timestamp < -item.start;
                });
                _metric.firstValueTime = _metric.firstValueTime === undefined ? currentTimestamp : _metric.firstValueTime;
                _metric.lastValueTime = currentTimestamp;
                _metric.count = _metric.raw.length;
              }
            };

            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              _loop();
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        })();
      }
    }
    /**
     * Get a metric key
     * @param {Metric.START|Metric.BEGINNING|Metric.CURRENT} key
     * @param {number|undefined} timestamp Timestamp to acts as the zero reference timestamp, default to current time.
     * @return {number}
     */

  }, {
    key: "getMetric",
    value: function getMetric(key) {
      var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (key && key.id && this.hasReferenceTime()) {
        var metric = this.metrics[key.id];

        if (metric && metric.lastValueTime - metric.firstValueTime >= key.requiredWindow) {
          if (key.mode === 'start') {
            return metric.sum / metric.count;
          } else if (key.mode === 'end') {
            var _context2, _context3, _context4;

            var currentTimestamp = this.getReferenceTime(timestamp);
            var metrics = (0, _map["default"])(_context2 = (0, _filter["default"])(_context3 = (0, _filter["default"])(_context4 = metric.raw).call(_context4, function (rec) {
              return currentTimestamp - rec.timestamp <= -key.start;
            })).call(_context3, function (rec) {
              return currentTimestamp - rec.timestamp >= -key.end;
            })).call(_context2, function (rec) {
              return rec.value;
            });
            return (0, _reduce["default"])(metrics).call(metrics, function (a, b) {
              return a + b;
            }, 0) / metrics.length;
          }
        }
      }

      return undefined;
    }
  }], [{
    key: "START",
    get:
    /**
     * The avg data over time 0 to 2000 ms
     * @constructor
     */
    function get() {
      return {
        id: 'start',
        start: 0,
        end: 2000,
        mode: 'start',
        requiredWindow: 1250
      };
    }
    /**
     * The avg data over time 2000 to 7000ms
     * @constructor
     */

  }, {
    key: "BEGINNING",
    get: function get() {
      return {
        id: 'beginning',
        start: 2000,
        end: 7000,
        mode: 'start',
        requiredWindow: 4000
      };
    }
    /**
     * The avg data over time 2000 to 7000ms
     * @constructor
     */

  }, {
    key: "OVERALL",
    get: function get() {
      return {
        id: 'overall',
        start: 4500,
        end: 24 * 60 * 60 * 1000,
        // 24 hours
        mode: 'start',
        requiredWindow: 4500
      };
    }
  }, {
    key: "CURRENT",
    get: function get() {
      return {
        id: 'current',
        start: -5000,
        end: 0,
        mode: 'end',
        requiredWindow: 2500
      };
    }
  }, {
    key: "ALL_METRICS",
    get: function get() {
      return [Metric.START, Metric.BEGINNING, Metric.OVERALL, Metric.CURRENT];
    }
  }]);
  return Metric;
}();

exports["default"] = Metric;