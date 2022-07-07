import Metric from './Metric';
import Measurement from './Measurement';
import UserAgentParser from './UserAgentParser';
import FramePerSecondHistogram from './FramePerSecondHistogram';

export default class Classification {
  constructor(streamingViewId, logger) {
    this.logger = logger;
    this.streamingViewId = streamingViewId;

    this.numberReportsCreated = 0;
    this.metricPeriodEndHandlers = [];
    this.classificationRecordingStarted = false;

    this.browser = new UserAgentParser();
    this.metricsFramesDecodedPerSecond = new Metric();
    this.metricsInterFrameDelayStandardDeviation = new Metric();
    this.framesDecodedPerSecondHistogram = new FramePerSecondHistogram();
  }

  destroy() {
    this.metricPeriodEndHandlers.forEach(this.metricsFramesDecodedPerSecond.offMetricPeriodEnd);
  }

  injectMeasurement(framesDecodedPerSecond, interFrameDelayStandardDeviationInMs) {
    this.metricsFramesDecodedPerSecond.inject(framesDecodedPerSecond);
    this.metricsInterFrameDelayStandardDeviation.inject(interFrameDelayStandardDeviationInMs);
    this.framesDecodedPerSecondHistogram.inject(framesDecodedPerSecond);
  }

  // Will keep recording until end of stream
  startMeasurement() {
    this.classificationRecordingStarted = true;
    if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
      this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
      this.metricsFramesDecodedPerSecond.setReferenceTime();
      this.framesDecodedPerSecondHistogram.addSeparator();
    }
  }

  registerMetricEventListener(callback) {
    // We only care about proxying one of either the two metrics that are registered, so it's a bit of a hack.
    const triggeredMetrics = {};

    const handleMetricPeriodEnd = (evt) => {
      if (triggeredMetrics[evt.type]) {
        return;
      } // This was already triggered, discard!
      callback(evt);
      triggeredMetrics[evt.type] = true;
    };

    this.metricPeriodEndHandlers.push(handleMetricPeriodEnd);
    this.metricsFramesDecodedPerSecond.onMetricPeriodEnd(handleMetricPeriodEnd);
  }

  createClassificationReport(reportTrigger = 'unknown') {
    this.logger.info('create classification report');
    this.isClassificationReportCreated = true;
    const framesDecodedPerSecondStart = this.metricsFramesDecodedPerSecond.getMetric(Metric.START);
    const framesDecodedPerSecondBeginning = this.metricsFramesDecodedPerSecond.getMetric(Metric.BEGINNING);
    const framesDecodedPerSecondOverall = this.metricsFramesDecodedPerSecond.getMetric(Metric.OVERALL);
    const framesDecodedPerSecondCurrent = this.metricsFramesDecodedPerSecond.getMetric(Metric.CURRENT);

    const interFrameDelayStandardDeviationStart = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.START);
    const interFrameDelayStandardDeviationBeginning = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.BEGINNING);
    const interFrameDelayStandardDeviationOverall = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.OVERALL);
    const interFrameDelayStandardDeviationCurrent = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.CURRENT);

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
    const createClassification = () => {
      const classificationReport = [];

      if (!this.classificationRecordingStarted) {
        return ['stream-not-resumed'];
      }

      if (
        !interFrameDelayStandardDeviationStart &&
        !interFrameDelayStandardDeviationBeginning &&
        !interFrameDelayStandardDeviationCurrent
      ) {
        if (!this.browser.isSupportedBrowser()) {
          return ['unsupported-browser'];
        }
        return ['missing-iframe-stddev'];
      }

      // overall no issue was detected
      if (
        framesDecodedPerSecondStart > 45 &&
        framesDecodedPerSecondBeginning > 45 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 &&
        (interFrameDelayStandardDeviationStart || Number.MAX_VALUE) < 15 &&
        (interFrameDelayStandardDeviationBeginning || Number.MAX_VALUE) < 15 &&
        (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) < 15
      ) {
        return ['no-slow-motion-detected'];
      }

      // Prevent trigger if we have not reached this point in classification
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

    const legacyClassification = () => {
      // Unsupported device, for now only chrome is supported
      if (framesDecodedPerSecondStart === undefined || interFrameDelayStandardDeviationStart === undefined) {
        return 'unsupported-device';
      }

      // overall no issue was detected
      if (
        framesDecodedPerSecondStart > 45 &&
        framesDecodedPerSecondBeginning > 45 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 &&
        interFrameDelayStandardDeviationStart < 15 &&
        interFrameDelayStandardDeviationBeginning < 15 &&
        (interFrameDelayStandardDeviationOverall || 0) < 15
      ) {
        return 'no-slow-motion-detected';
      }

      // consistent low fps over the whole session.
      if (framesDecodedPerSecondStart < 45 && framesDecodedPerSecondBeginning < 45 && (framesDecodedPerSecondOverall || 0) < 45) {
        return 'consistent-slow-motion-detected';
      }

      // consistent high inter frame delay standard deviation over the whole game session.
      if (
        interFrameDelayStandardDeviationStart > 15 &&
        interFrameDelayStandardDeviationBeginning > 15 &&
        (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) > 15
      ) {
        return 'consistent-slow-motion-detected';
      }

      // slow start due to low fps in beginning
      if (
        framesDecodedPerSecondStart < 45 &&
        framesDecodedPerSecondBeginning < 45 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 &&
        (interFrameDelayStandardDeviationOverall || 0) < 15
      ) {
        return 'slow-beginning-detected';
      }

      // slow start due to high inter frame delay std dev in beginning
      if (
        interFrameDelayStandardDeviationStart > 15 &&
        interFrameDelayStandardDeviationBeginning > 15 &&
        (interFrameDelayStandardDeviationOverall || 0) < 15 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45
      ) {
        return 'slow-beginning-detected';
      }

      // slow start due to low fps in start
      if (
        framesDecodedPerSecondStart < 45 &&
        framesDecodedPerSecondBeginning > 45 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 &&
        interFrameDelayStandardDeviationBeginning < 15
      ) {
        return 'slow-start-detected';
      }

      // slow start due to high inter frame delay std dev in start
      if (
        interFrameDelayStandardDeviationStart > 15 &&
        interFrameDelayStandardDeviationBeginning < 15 &&
        (interFrameDelayStandardDeviationOverall || 0) < 15 &&
        (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45
      ) {
        return 'slow-start-detected';
      }

      // consistent low fps or high inter frame delay std dev over the session.
      if (framesDecodedPerSecondOverall < 45 || interFrameDelayStandardDeviationOverall > 15) {
        return 'consistent-slow-motion-detected';
      }

      return 'no-classification-detected';
    };

    const classificationReport = createClassification();

    return {
      reportTrigger: reportTrigger,
      reportNumber: ++this.numberReportsCreated,
      // The "most significant" classification
      classification: legacyClassification(),
      classificationReport: classificationReport,
      duration: this.metricsFramesDecodedPerSecond.getReferenceTime(),
      streamingViewId: this.streamingViewId,
      framesDecodedPerSecond: {
        start: Measurement.roundToDecimals(framesDecodedPerSecondStart),
        beginning: Measurement.roundToDecimals(framesDecodedPerSecondBeginning),
        overall: Measurement.roundToDecimals(framesDecodedPerSecondOverall),
        current: Measurement.roundToDecimals(framesDecodedPerSecondCurrent),
        histogram: this.framesDecodedPerSecondHistogram.getMetric(),
      },
      interFrameDelayStandardDeviation: {
        start: Measurement.roundToDecimals(interFrameDelayStandardDeviationStart),
        beginning: Measurement.roundToDecimals(interFrameDelayStandardDeviationBeginning),
        overall: Measurement.roundToDecimals(interFrameDelayStandardDeviationOverall),
        current: Measurement.roundToDecimals(interFrameDelayStandardDeviationCurrent),
      },
    };
  }
}
