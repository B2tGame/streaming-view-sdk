"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _values = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/values"));

var _sort = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/sort"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _PredictGameExperienceBase = _interopRequireDefault(require("./PredictGameExperienceBase"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * RisingEdgeDetector class
 */
var RisingEdgeDetector = /*#__PURE__*/function () {
  function RisingEdgeDetector() {
    (0, _classCallCheck2.default)(this, RisingEdgeDetector);
    this.isHigh = false;
  }

  (0, _createClass2.default)(RisingEdgeDetector, [{
    key: "next",
    value: function next(value, threshold) {
      if (value > threshold) {
        if (!this.isHigh) {
          this.isHigh = true;
          return 1;
        } else {
          return 0;
        }
      } else {
        this.isHigh = false;
        return 0;
      }
    }
  }]);
  return RisingEdgeDetector;
}();
/**
 * RollingWindow class
 */


var RollingWindow = /*#__PURE__*/function () {
  function RollingWindow(sampleSize) {
    (0, _classCallCheck2.default)(this, RollingWindow);
    this.sampleSize = sampleSize;
    this.values = [];
  }

  (0, _createClass2.default)(RollingWindow, [{
    key: "add",
    value: function add(value) {
      (0, _values.default)(this).push(value);

      if ((0, _values.default)(this).length > this.sampleSize) {
        (0, _values.default)(this).shift();
      }
    }
  }, {
    key: "getValues",
    value: function getValues() {
      return (0, _values.default)(this);
    }
  }, {
    key: "getLastValue",
    value: function getLastValue() {
      return (0, _values.default)(this)[(0, _values.default)(this).length - 1];
    }
  }]);
  return RollingWindow;
}();
/**
 * PredictGameExperience class
 */


var PredictGameExperience = /*#__PURE__*/function (_PredictGameExperienc) {
  (0, _inherits2.default)(PredictGameExperience, _PredictGameExperienc);

  var _super = _createSuper(PredictGameExperience);

  function PredictGameExperience() {
    var _this;

    var sampleSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    var risingEdgeThreshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2.8;
    var longTermSampleSizeMultiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4;
    var predictGameExperienceSampleSizeMultiple = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.5;
    var averageDetectionUpperRange = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;
    var stabilizationThreshold = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0.2;
    var roundTripTimeRisingEdgeScore = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1.5;
    var packageLostPercentageRisingEdgeScore = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var maxRisingEdgeScore = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 1.5;
    var highRoundTripTimeGain = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 150;
    var highRoundTripTimeLowerThreshold = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 0.5;
    var risingEdgeCountGain = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 0.7;
    var risingEdgeCountPower = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : 1.25;
    var finalGain = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : 1.1;
    (0, _classCallCheck2.default)(this, PredictGameExperience);
    _this = _super.call(this);
    _this.sampleSize = sampleSize;
    _this.averageDetectionUpperRange = averageDetectionUpperRange;
    _this.risingEdgeThreshold = risingEdgeThreshold;
    _this.stabilizationThreshold = stabilizationThreshold;
    _this.roundTripTimeRisingEdgeScore = roundTripTimeRisingEdgeScore;
    _this.packageLostPercentageRisingEdgeScore = packageLostPercentageRisingEdgeScore;
    _this.maxRisingEdgeScore = maxRisingEdgeScore;
    _this.highRoundTripTimeGain = highRoundTripTimeGain;
    _this.highRoundTripTimeLowerThreshold = highRoundTripTimeLowerThreshold;
    _this.risingEdgeCountGain = risingEdgeCountGain;
    _this.risingEdgeCountPower = risingEdgeCountPower;
    _this.finalGain = finalGain;
    _this.roundTripTimeLong = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    _this.roundTripTimeShort = new RollingWindow(sampleSize);
    _this.roundTripTime = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    _this.roundTripTimeRisingEdgeDetector = new RisingEdgeDetector();
    _this.roundTripTimeRisingEdge = new RollingWindow(sampleSize);
    _this.packageLostPercentage = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    _this.packageLostPercentageRisingEdgeDetector = new RisingEdgeDetector();
    _this.packageLostPercentageRisingEdge = new RollingWindow(sampleSize);
    _this.predictGameExperience = new RollingWindow(sampleSize * predictGameExperienceSampleSizeMultiple);
    _this.count = 0;
    return _this;
  }
  /**
   *
   * @param {number} roundTripTime
   * @param {number} packageLostPercentage
   * @return {undefined|number}
   */


  (0, _createClass2.default)(PredictGameExperience, [{
    key: "predict",
    value: function predict(roundTripTime, packageLostPercentage) {
      this.count++;
      this.roundTripTimeLong.add(roundTripTime);
      this.roundTripTimeShort.add(roundTripTime);
      this.packageLostPercentage.add(packageLostPercentage);
      var roundTripTimeAverage = this.averageRange(this.roundTripTimeLong.getValues(), 0, this.averageDetectionUpperRange);
      var packageLostPercentageAverage = this.averageRange(this.packageLostPercentage.getValues(), 0, this.averageDetectionUpperRange);
      this.roundTripTimeRisingEdge.add(Math.min(this.roundTripTimeRisingEdgeDetector.next(roundTripTime, roundTripTimeAverage * this.risingEdgeThreshold) * this.roundTripTimeRisingEdgeScore + this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold) * this.packageLostPercentageRisingEdgeScore, this.maxRisingEdgeScore));
      this.packageLostPercentageRisingEdge.add(this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold));
      var risingEdgeCount = this.sum(this.roundTripTimeRisingEdge.getValues());
      this.predictGameExperience.add(5 - Math.pow(risingEdgeCount * this.risingEdgeCountGain, this.risingEdgeCountPower) * this.finalGain + Math.min(this.highRoundTripTimeLowerThreshold - this.average(this.roundTripTimeShort.getValues()) / this.highRoundTripTimeGain, 0));
      return this.count < this.sampleSize ? undefined : Math.min(Math.max(this.averageRange(this.predictGameExperience.getValues(), 0, this.stabilizationThreshold), 1), 5);
    }
  }, {
    key: "averageRange",
    value: function averageRange(dataset) {
      var _context;

      var lowerBound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var upperBound = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var data = (0, _sort.default)(_context = (0, _toConsumableArray2.default)(dataset)).call(_context, function (a, b) {
        return a < b ? -1 : 1;
      });
      return this.average((0, _slice.default)(data).call(data, Math.round((data.length - 1) * lowerBound), Math.round((data.length - 1) * upperBound)));
    }
  }, {
    key: "average",
    value: function average(dataset) {
      return (0, _reduce.default)(dataset).call(dataset, function (a, b) {
        return a + b;
      }, 0) / dataset.length || 0;
    }
  }, {
    key: "sum",
    value: function sum(dataset) {
      return (0, _reduce.default)(dataset).call(dataset, function (a, b) {
        return a + b;
      }, 0);
    }
  }]);
  return PredictGameExperience;
}(_PredictGameExperienceBase.default);

exports.default = PredictGameExperience;