"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _Metric = _interopRequireDefault(require("./Metric"));

var _Measurement = _interopRequireDefault(require("./Measurement"));

var _UserAgentParser = _interopRequireDefault(require("./UserAgentParser"));

var _FramePerSecondHistogram = _interopRequireDefault(require("./FramePerSecondHistogram"));

var Classification = /*#__PURE__*/function () {
  function Classification(streamingViewId, logger) {
    (0, _classCallCheck2.default)(this, Classification);
    this.logger = logger;
    this.streamingViewId = streamingViewId;
    this.numberReportsCreated = 0;
    this.metricPeriodEndHandlers = [];
    this.classificationRecordingStarted = false;
    this.browser = new _UserAgentParser.default();
    this.metricsFramesDecodedPerSecond = new _Metric.default();
    this.metricsInterFrameDelayStandardDeviation = new _Metric.default();
    this.framesDecodedPerSecondHistogram = new _FramePerSecondHistogram.default();
  }

  (0, _createClass2.default)(Classification, [{
    key: "destroy",
    value: function destroy() {
      this.metricPeriodEndHandlers.forEach(this.metricsFramesDecodedPerSecond.offMetricPeriodEnd);
    }
  }, {
    key: "injectMeasurement",
    value: function injectMeasurement(framesDecodedPerSecond, interFrameDelayStandardDeviationInMs) {
      this.metricsFramesDecodedPerSecond.inject(framesDecodedPerSecond);
      this.metricsInterFrameDelayStandardDeviation.inject(interFrameDelayStandardDeviationInMs);
      this.framesDecodedPerSecondHistogram.inject(framesDecodedPerSecond);
    } // Will keep recording until end of stream

  }, {
    key: "startMeasurement",
    value: function startMeasurement() {
      this.classificationRecordingStarted = true;

      if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
        this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
        this.metricsFramesDecodedPerSecond.setReferenceTime();
        this.framesDecodedPerSecondHistogram.addSeparator();
      }
    }
  }, {
    key: "registerMetricEventListener",
    value: function registerMetricEventListener(callback) {
      // We only care about proxying one of either the two metrics that are registered, so it's a bit of a hack.
      var triggeredMetrics = {};

      var handleMetricPeriodEnd = function handleMetricPeriodEnd(evt) {
        if (triggeredMetrics[evt.type]) {
          return;
        } // This was already triggered, discard!


        callback(evt);
        triggeredMetrics[evt.type] = true;
      };

      this.metricPeriodEndHandlers.push(handleMetricPeriodEnd);
      this.metricsFramesDecodedPerSecond.onMetricPeriodEnd(handleMetricPeriodEnd);
    }
  }, {
    key: "createClassificationReport",
    value: function createClassificationReport() {
      var _this = this;

      var reportTrigger = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'unknown';
      this.logger.info('create classification report');
      this.isClassificationReportCreated = true;
      var framesDecodedPerSecondStart = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.START);
      var framesDecodedPerSecondBeginning = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.BEGINNING);
      var framesDecodedPerSecondOverall = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.OVERALL);
      var framesDecodedPerSecondCurrent = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.CURRENT);
      var interFrameDelayStandardDeviationStart = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.START);
      var interFrameDelayStandardDeviationBeginning = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.BEGINNING);
      var interFrameDelayStandardDeviationOverall = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.OVERALL);
      var interFrameDelayStandardDeviationCurrent = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.CURRENT);
      /**
       *  There are three "types" of classification,
       *  good, bad and error. They are put in an
       *  ordered by precedence like such:
       *
       *    1. stream-not-resumed (possible user error)
       *    2. unsupported-browser (error)
       *    3. missing-iframe-stddev (error)
       *    4. no-slow-motion-detected (good)
       *    5. consistent-slow-motion-detected (bad)
       *    6. slow-beginning-detected (bad)
       *    7. slow-start-detected (acceptable)
       *    8. no-classification-detected (error)
       */

      var createClassification = function createClassification() {
        var classificationReport = [];

        if (!_this.classificationRecordingStarted) {
          return ['stream-not-resumed'];
        }

        if (!interFrameDelayStandardDeviationStart && !interFrameDelayStandardDeviationBeginning && !interFrameDelayStandardDeviationCurrent) {
          if (!_this.browser.isSupportedBrowser()) {
            return ['unsupported-browser'];
          }

          return ['missing-iframe-stddev'];
        } // overall no issue was detected


        if (framesDecodedPerSecondStart > 45 && framesDecodedPerSecondBeginning > 45 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 && (interFrameDelayStandardDeviationStart || Number.MAX_VALUE) < 15 && (interFrameDelayStandardDeviationBeginning || Number.MAX_VALUE) < 15 && (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) < 15) {
          return ['no-slow-motion-detected'];
        } // Prevent trigger if we have not reached this point in classification


        if (framesDecodedPerSecondOverall !== undefined && interFrameDelayStandardDeviationOverall !== undefined) {
          if ((framesDecodedPerSecondOverall || 0) < 45 || (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) > 15) {
            // consistent low fps over the whole session.
            classificationReport.push('consistent-slow-motion-detected');
          }
        }

        if (framesDecodedPerSecondBeginning !== undefined && interFrameDelayStandardDeviationBeginning !== undefined) {
          if (framesDecodedPerSecondBeginning < 45 || (interFrameDelayStandardDeviationBeginning || Number.MAX_VALUE) > 15) {
            // slow start due to low fps in beginning OR due to high inter frame delay std dev in beginning
            classificationReport.push('slow-beginning-detected');
          }
        }

        if (framesDecodedPerSecondStart !== undefined && interFrameDelayStandardDeviationStart !== undefined) {
          if (framesDecodedPerSecondStart < 45 || (interFrameDelayStandardDeviationStart || Number.MAX_VALUE) > 15) {
            // slow start due to low fps or high inter frame delay at start
            classificationReport.push('slow-start-detected');
          }
        }

        return classificationReport.length ? classificationReport : ['no-classification-detected'];
      };

      var legacyClassification = function legacyClassification() {
        // Unsupported device, for now only chrome is supported
        if (framesDecodedPerSecondStart === undefined || interFrameDelayStandardDeviationStart === undefined) {
          return 'unsupported-device';
        } // overall no issue was detected


        if (framesDecodedPerSecondStart > 45 && framesDecodedPerSecondBeginning > 45 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 && interFrameDelayStandardDeviationStart < 15 && interFrameDelayStandardDeviationBeginning < 15 && (interFrameDelayStandardDeviationOverall || 0) < 15) {
          return 'no-slow-motion-detected';
        } // consistent low fps over the whole session.


        if (framesDecodedPerSecondStart < 45 && framesDecodedPerSecondBeginning < 45 && (framesDecodedPerSecondOverall || 0) < 45) {
          return 'consistent-slow-motion-detected';
        } // consistent high inter frame delay standard deviation over the whole game session.


        if (interFrameDelayStandardDeviationStart > 15 && interFrameDelayStandardDeviationBeginning > 15 && (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) > 15) {
          return 'consistent-slow-motion-detected';
        } // slow start due to low fps in beginning


        if (framesDecodedPerSecondStart < 45 && framesDecodedPerSecondBeginning < 45 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 && (interFrameDelayStandardDeviationOverall || 0) < 15) {
          return 'slow-beginning-detected';
        } // slow start due to high inter frame delay std dev in beginning


        if (interFrameDelayStandardDeviationStart > 15 && interFrameDelayStandardDeviationBeginning > 15 && (interFrameDelayStandardDeviationOverall || 0) < 15 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45) {
          return 'slow-beginning-detected';
        } // slow start due to low fps in start


        if (framesDecodedPerSecondStart < 45 && framesDecodedPerSecondBeginning > 45 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 && interFrameDelayStandardDeviationBeginning < 15) {
          return 'slow-start-detected';
        } // slow start due to high inter frame delay std dev in start


        if (interFrameDelayStandardDeviationStart > 15 && interFrameDelayStandardDeviationBeginning < 15 && (interFrameDelayStandardDeviationOverall || 0) < 15 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45) {
          return 'slow-start-detected';
        } // consistent low fps or high inter frame delay std dev over the session.


        if (framesDecodedPerSecondOverall < 45 || interFrameDelayStandardDeviationOverall > 15) {
          return 'consistent-slow-motion-detected';
        }

        return 'no-classification-detected';
      };

      var classificationReport = createClassification();
      return {
        reportTrigger: reportTrigger,
        reportNumber: ++this.numberReportsCreated,
        // The "most significant" classification
        classification: legacyClassification(),
        classificationReport: classificationReport,
        duration: this.metricsFramesDecodedPerSecond.getReferenceTime(),
        streamingViewId: this.streamingViewId,
        framesDecodedPerSecond: {
          start: _Measurement.default.roundToDecimals(framesDecodedPerSecondStart),
          beginning: _Measurement.default.roundToDecimals(framesDecodedPerSecondBeginning),
          overall: _Measurement.default.roundToDecimals(framesDecodedPerSecondOverall),
          current: _Measurement.default.roundToDecimals(framesDecodedPerSecondCurrent),
          histogram: this.framesDecodedPerSecondHistogram.getMetric()
        },
        interFrameDelayStandardDeviation: {
          start: _Measurement.default.roundToDecimals(interFrameDelayStandardDeviationStart),
          beginning: _Measurement.default.roundToDecimals(interFrameDelayStandardDeviationBeginning),
          overall: _Measurement.default.roundToDecimals(interFrameDelayStandardDeviationOverall),
          current: _Measurement.default.roundToDecimals(interFrameDelayStandardDeviationCurrent)
        }
      };
    }
  }]);
  return Classification;
}();

exports.default = Classification;