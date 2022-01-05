"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _PredictGameExperience = _interopRequireDefault(require("./PredictGameExperience"));

var _PredictGameExperienceWithNeuralNetwork = _interopRequireDefault(require("./PredictGameExperienceWithNeuralNetwork"));

var _StreamWebRtc = _interopRequireDefault(require("./StreamWebRtc"));

var _StreamSocket = _interopRequireDefault(require("./StreamSocket"));

var _Metric = _interopRequireDefault(require("./Metric"));

var _FramePerSecondHistogram = _interopRequireDefault(require("./FramePerSecondHistogram"));

var _UserAgentParser = _interopRequireDefault(require("./UserAgentParser"));

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
class Measurement {
  /**
   *
   * @param {string} edgeNodeId
   * @param {Logger} logger
   */
  constructor(edgeNodeId, streamingViewId, logger) {
    this.onStreamQualityRating = rating => {
      this.streamQualityRating = rating.streamQualityRating;
    };

    this.onStreamBlackScreen = () => {
      this.numberOfBlackScreens += 1;
    };

    this.onRoundTripTimeMeasurement = networkRoundTripTime => {
      this.networkRoundTripTime = networkRoundTripTime;
    };

    this.onWebRtcRoundTripTimeMeasurement = webrtcRoundTripTime => {
      this.webrtcRoundTripTimeValues.push(webrtcRoundTripTime);
    };

    this.onWebRtcMeasurement = stats => {
      this.reportWebRtcMeasurement(stats);
    };

    this.onStreamDisconnected = () => {
      this.previousMeasurement = this.defaultPreviousMeasurement();
    };

    this.onStreamTerminated = () => {
      this.createClassificationReport();
    };

    this.onStreamResumed = () => {
      this.isStreamResumed = true;

      if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
        this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
        this.metricsFramesDecodedPerSecond.setReferenceTime();
        this.framesDecodedPerSecondHistogram.addSeparator();
      }
    };

    this.onEmulatorConfiguration = payload => {
      if (payload.state === 'resumed') {
        this.isStreamResumed = true;

        if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
          this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
          this.metricsFramesDecodedPerSecond.setReferenceTime();
          this.framesDecodedPerSecondHistogram.addSeparator();
        }
      }
    };

    this.edgeNodeId = edgeNodeId;
    this.streamingViewId = streamingViewId;
    this.logger = logger;
    this.networkRoundTripTime = 0;
    this.webrtcRoundTripTime = 0;
    this.webrtcRoundTripTimeValues = [];
    this.isStreamResumed = false;
    this.streamQualityRating = 0;
    this.numberOfBlackScreens = 0;
    this.previousMeasurement = this.defaultPreviousMeasurement();
    this.measurement = {};
    this.webRtcHost = undefined;
    this.webRtcIntervalHandler = undefined;
    this.metricsFramesDecodedPerSecond = new _Metric.default();
    this.metricsInterFrameDelayStandardDeviation = new _Metric.default();
    this.framesDecodedPerSecondHistogram = new _FramePerSecondHistogram.default();
    this.browser = new _UserAgentParser.default();
    this.isClassificationReportCreated = false;

    _StreamingEvent.default.edgeNode(edgeNodeId).on(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement).on(_StreamingEvent.default.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement).on(_StreamingEvent.default.STREAM_QUALITY_RATING, this.onStreamQualityRating).on(_StreamingEvent.default.STREAM_BLACK_SCREEN, this.onStreamBlackScreen).on(_StreamingEvent.default.STREAM_DISCONNECTED, this.onStreamDisconnected).on(_StreamingEvent.default.STREAM_TERMINATED, this.onStreamTerminated).on(_StreamingEvent.default.STREAM_RESUMED, this.onStreamResumed).on(_StreamingEvent.default.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration);
  }
  /**
   * @param {string} webRtcHost
   * @param {number} pingInterval
   */


  initWebRtc(webRtcHost, pingInterval) {
    this.webRtcHost = webRtcHost;
    this.streamWebRtc = new _StreamWebRtc.default(webRtcHost, pingInterval);
    this.streamWebRtc.on(_StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);

    _StreamingEvent.default.edgeNode(this.edgeNodeId).on(_StreamingEvent.default.STREAM_UNREACHABLE, this.streamWebRtc.close);

    this.webRtcIntervalHandler = setInterval(() => {
      _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT);
    }, _StreamSocket.default.WEBSOCKET_PING_INTERVAL);
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_TYPE_INBOUND_RTP() {
    return 'inbound-rtp';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_TYPE_TRACK() {
    return 'track';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_TYPE_DATA_CHANNEL() {
    return 'data-channel';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_TYPE_CANDIDATE_PAIR() {
    return 'candidate-pair';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_KIND_VIDEO() {
    return 'video';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_LABEL_MOUSE() {
    return 'mouse';
  }
  /**
   *
   * @return {string}
   */


  static get REPORT_LABEL_TOUCH() {
    return 'touch';
  }
  /**
   *
   * @return {string}
   */


  static get PREDICTED_GAME_EXPERIENCE_ALPHA() {
    return 'alpha';
  }
  /**
   *
   * @return {string}
   */


  static get PREDICTED_GAME_EXPERIENCE_NEURAL1() {
    return 'neural1';
  }
  /**
   *
   * @return {string}
   */


  static get PREDICTED_GAME_EXPERIENCE_DEFAULT() {
    return Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA;
  }
  /**
   *
   * @return {string[]}
   */


  static get PREDICTED_GAME_EXPERIENCE_ALGORITHMS() {
    return [Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA, Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1];
  }

  destroy() {
    this.logger.info('measurement module is destroyed');

    _StreamingEvent.default.edgeNode(this.edgeNodeId).off(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement).off(_StreamingEvent.default.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement).off(_StreamingEvent.default.STREAM_QUALITY_RATING, this.onStreamQualityRating).off(_StreamingEvent.default.STREAM_BLACK_SCREEN, this.onStreamBlackScreen).off(_StreamingEvent.default.STREAM_DISCONNECTED, this.onStreamDisconnected).off(_StreamingEvent.default.STREAM_RESUMED, this.onStreamResumed).off(_StreamingEvent.default.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration).off(_StreamingEvent.default.STREAM_TERMINATED, this.onStreamTerminated);

    this.createClassificationReport();

    if (this.webRtcIntervalHandler) {
      clearInterval(this.webRtcIntervalHandler);
      this.webRtcIntervalHandler = undefined;
    }

    if (this.streamWebRtc) {
      _StreamingEvent.default.edgeNode(this.edgeNodeId).off(_StreamingEvent.default.STREAM_UNREACHABLE, this.streamWebRtc.close);

      this.streamWebRtc.off(_StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);
      this.streamWebRtc.close();
    }
  }

  createClassificationReport() {
    if (this.isClassificationReportCreated) {
      this.logger.info('classification report already created');
      return;
    }

    this.logger.info('create classification report');
    this.isClassificationReportCreated = true;
    const framesDecodedPerSecondStart = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.START);
    const framesDecodedPerSecondBeginning = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.BEGINNING);
    const framesDecodedPerSecondOverall = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.OVERALL);
    const framesDecodedPerSecondCurrent = this.metricsFramesDecodedPerSecond.getMetric(_Metric.default.CURRENT);
    const interFrameDelayStandardDeviationStart = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.START);
    const interFrameDelayStandardDeviationBeginning = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.BEGINNING);
    const interFrameDelayStandardDeviationOverall = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.OVERALL);
    const interFrameDelayStandardDeviationCurrent = this.metricsInterFrameDelayStandardDeviation.getMetric(_Metric.default.CURRENT);
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

      if (!this.isStreamResumed) {
        return ['stream-not-resumed'];
      }

      if (!interFrameDelayStandardDeviationStart && !interFrameDelayStandardDeviationBeginning && !interFrameDelayStandardDeviationCurrent) {
        if (!this.browser.isSupportedBrowser()) {
          return ['unsupported-browser'];
        }

        return ['missing-iframe-stddev'];
      } // overall no issue was detected


      if (framesDecodedPerSecondStart > 45 && framesDecodedPerSecondBeginning > 45 && (framesDecodedPerSecondOverall || Number.MAX_VALUE) > 45 && (interFrameDelayStandardDeviationStart || Number.MAX_VALUE) < 15 && (interFrameDelayStandardDeviationBeginning || Number.MAX_VALUE) < 15 && (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) < 15) {
        return ['no-slow-motion-detected'];
      }

      if ((framesDecodedPerSecondOverall || 0) < 45 || (interFrameDelayStandardDeviationOverall || Number.MAX_VALUE) > 15) {
        // consistent low fps over the whole session.
        classificationReport.push('consistent-slow-motion-detected');
      }

      if (framesDecodedPerSecondBeginning < 45 || (interFrameDelayStandardDeviationBeginning || Number.MAX_VALUE) > 15) {
        // slow start due to low fps in beginning OR due to high inter frame delay std dev in beginning
        classificationReport.push('slow-beginning-detected');
      }

      if (framesDecodedPerSecondStart < 45 || (interFrameDelayStandardDeviationStart || Number.MAX_VALUE) > 15) {
        // slow start due to low fps or high inter frame delay at start
        classificationReport.push('slow-start-detected');
      }

      return classificationReport.length ? classificationReport : ['no-classification-detected'];
    };

    const legacyClassification = () => {
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

    const classificationReport = createClassification();

    _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.CLASSIFICATION_REPORT, {
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
        histogram: this.framesDecodedPerSecondHistogram.getMetric()
      },
      interFrameDelayStandardDeviation: {
        start: Measurement.roundToDecimals(interFrameDelayStandardDeviationStart),
        beginning: Measurement.roundToDecimals(interFrameDelayStandardDeviationBeginning),
        overall: Measurement.roundToDecimals(interFrameDelayStandardDeviationOverall),
        current: Measurement.roundToDecimals(interFrameDelayStandardDeviationCurrent)
      }
    });
  }

  /**
   * Return default values for previous measurement
   * @return {{ messagesSentMouse: number, bytesReceived: number, framesReceived: number, messagesSentTouch: number, measureAt: number, totalDecodeTime: number, totalInterFrameDelay: number, totalSquaredInterFrameDelay: number, framesDecoded: number, framesDropped: null, jitter: null}}
   */
  defaultPreviousMeasurement() {
    return {
      framesDecoded: 0,
      bytesReceived: 0,
      totalDecodeTime: 0,
      totalInterFrameDelay: 0,
      totalSquaredInterFrameDelay: 0,
      framesReceived: 0,
      framesDropped: null,
      messagesSentMouse: 0,
      messagesSentTouch: 0,
      packetsLost: 0,
      packetsReceived: 0,
      jitter: null,
      measureAt: Date.now()
    };
  }
  /**
   * Process reports from the browser and send report measurements to the StreamSocket by REPORT_MEASUREMENT event
   * @param {RTCPeerConnection.getStats} stats
   */


  reportWebRtcMeasurement(stats) {
    this.measurement.measureAt = Date.now();
    this.measurement.measureDuration = (this.measurement.measureAt - this.previousMeasurement.measureAt) / 1000; // Process all reports and collect measurement data

    stats.forEach(report => {
      this.processInboundRtpVideoReport(report);
      this.processTrackVideoReport(report);
      this.processDataChannelMouseReport(report);
      this.processDataChannelTouchReport(report);
      this.processCandidatePairReport(report);
    });
    this.processWebRtcRoundTripTimeStats();
    this.previousMeasurement.measureAt = this.measurement.measureAt;
    this.measurement.streamQualityRating = this.streamQualityRating || 0;
    this.measurement.numberOfBlackScreens = this.numberOfBlackScreens || 0; // If predictedGameExperience is defined, report it as a float with 1 decimal

    if (this.measurement.predictedGameExperience) {
      _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.PREDICTED_GAME_EXPERIENCE, Measurement.roundToDecimals(this.measurement.predictedGameExperience[Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT], 1));
    }

    _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.REPORT_MEASUREMENT, {
      networkRoundTripTime: this.networkRoundTripTime,
      extra: this.measurement
    });

    this.measurement = {};
    this.numberOfBlackScreens = 0;
  }
  /**
   * Process inbound-rtp video report to fetch framesDecodedPerSecond, bytesReceivedPerSecond and videoProcessing
   * @param report
   */


  processInboundRtpVideoReport(report) {
    if (report.type === Measurement.REPORT_TYPE_INBOUND_RTP && report.kind === Measurement.REPORT_KIND_VIDEO) {
      this.measurement.framesDecodedPerSecond = (report.framesDecoded - this.previousMeasurement.framesDecoded) / this.measurement.measureDuration;
      this.measurement.bytesReceivedPerSecond = (report.bytesReceived - this.previousMeasurement.bytesReceived) / this.measurement.measureDuration;
      this.measurement.videoProcessing = report.framesDecoded - this.previousMeasurement.framesDecoded !== 0 ? ((report.totalDecodeTime || 0) - this.previousMeasurement.totalDecodeTime) * 1000 / this.measurement.framesDecodedPerSecond : 0;
      this.measurement.totalDecodeTimePerSecond = Measurement.roundToDecimals((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) / this.measurement.measureDuration);
      this.measurement.totalInterFrameDelayPerSecond = Measurement.roundToDecimals((report.totalInterFrameDelay - this.previousMeasurement.totalInterFrameDelay) / this.measurement.measureDuration);
      const currentPacketsLost = report.packetsLost - this.previousMeasurement.packetsLost;
      const currentPacketsReceived = report.packetsReceived - this.previousMeasurement.packetsReceived;
      const expectedPacketsReceived = currentPacketsLost + currentPacketsReceived;
      this.measurement.packetsLostPercent = currentPacketsLost * 100 / expectedPacketsReceived;
      this.measurement.jitter = report.jitter;
      this.measurement.totalDecodeTimePerFramesDecodedInMs = Measurement.roundToDecimals((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) / (report.framesDecoded - this.previousMeasurement.framesDecoded) * 1000);
      this.measurement.interFrameDelayStandardDeviationInMs = Measurement.roundToDecimals(Measurement.calculateStandardDeviation(report, this.previousMeasurement));
      this.previousMeasurement.framesDecoded = report.framesDecoded;
      this.previousMeasurement.bytesReceived = report.bytesReceived;
      this.previousMeasurement.totalDecodeTime = report.totalDecodeTime;
      this.previousMeasurement.totalInterFrameDelay = report.totalInterFrameDelay;
      this.previousMeasurement.totalSquaredInterFrameDelay = report.totalSquaredInterFrameDelay;
      this.previousMeasurement.packetsLost = report.packetsLost;
      this.previousMeasurement.packetsReceived = report.packetsReceived;
      this.previousMeasurement.jitter = report.jitter;
      this.metricsFramesDecodedPerSecond.inject(this.measurement.framesDecodedPerSecond);
      this.metricsInterFrameDelayStandardDeviation.inject(this.measurement.interFrameDelayStandardDeviationInMs);
      this.framesDecodedPerSecondHistogram.inject(this.measurement.framesDecodedPerSecond);
    }
  }
  /**
   * Calculates standard deviation value for the given input
   * @param {{}} currentStats
   * @param {{}} previousStats
   * @return {number|undefined} Standard deviation value
   */


  processWebRtcRoundTripTimeStats() {
    this.webrtcRoundTripTime = _StreamWebRtc.default.calculateRoundTripTimeStats(this.webrtcRoundTripTimeValues).rtt;
    this.webrtcRoundTripTimeValues = [];
    this.measurement.predictedGameExperience = Measurement.calculatePredictedGameExperience(this.networkRoundTripTime, this.measurement.packetsLostPercent);
    this.measurement.webrtcRoundTripTime = this.webrtcRoundTripTime;
  }
  /**
   * Process candidate-pair report to fetch currentRoundTripTime
   * @param report
   */


  processCandidatePairReport(report) {
    if (report.type === Measurement.REPORT_TYPE_CANDIDATE_PAIR && report.writable === true) {
      this.measurement.webrtcCurrentRoundTripTime = report.currentRoundTripTime * 1000;
    }
  }
  /**
   * Calculates a predicted game experience value based on rtt and packet lost percent
   * @param {number} rtt
   * @param {number} packetLostPercent
   * @param {string} region
   * @return {{Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA: undefined|number, Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1: undefined|number}}
   */


  static calculatePredictedGameExperience(rtt, packetLostPercent) {
    let region = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'default';

    if (Measurement.predictGameExperience === undefined) {
      Measurement.predictGameExperience = {};
    }

    if (Measurement.predictGameExperience[region] === undefined) {
      Measurement.predictGameExperience[region] = {};
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA] = new _PredictGameExperience.default();
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1] = new _PredictGameExperienceWithNeuralNetwork.default(require('./neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49'));
    }

    return Measurement.PREDICTED_GAME_EXPERIENCE_ALGORITHMS.reduce((result, algorithm) => {
      result[algorithm] = Measurement.predictGameExperience[region][algorithm].predict(rtt, packetLostPercent);
      return result;
    }, {});
  }
  /**
   * Process track video report to fetch framesReceivedPerSecond and framesDropped
   * @param report
   */


  processTrackVideoReport(report) {
    if (report.type === Measurement.REPORT_TYPE_TRACK && report.kind === Measurement.REPORT_KIND_VIDEO) {
      this.measurement.framesReceivedPerSecond = (report.framesReceived - this.previousMeasurement.framesReceived) / this.measurement.measureDuration;
      this.measurement.framesDropped = report.framesDropped - this.previousMeasurement.framesDropped;
      this.measurement.jitterBufferDelay = report.jitterBufferDelay * 1000;
      this.measurement.jitterBufferEmittedCount = report.jitterBufferEmittedCount;
      this.previousMeasurement.framesReceived = report.framesReceived;
      this.previousMeasurement.framesDropped = report.framesDropped;
    }
  }
  /**
   * Process mouse data channel report to fetch mouseMessagesSentPerSecond
   * @param report
   */


  processDataChannelMouseReport(report) {
    //Extract data-channel:mouse logs
    if (report.type === Measurement.REPORT_TYPE_DATA_CHANNEL && report.label === Measurement.REPORT_LABEL_MOUSE) {
      this.measurement.mouseMessagesSentPerSecond = (report.messagesSent - this.previousMeasurement.messagesSentMouse) / this.measurement.measureDuration;
      this.previousMeasurement.messagesSentMouse = report.messagesSent;
    }
  }
  /**
   * Process touch data channel report to fetch touchMessagesSentPerSecond
   * @param report
   */


  processDataChannelTouchReport(report) {
    //Extract data-channel:touch logs
    if (report.type === Measurement.REPORT_TYPE_DATA_CHANNEL && report.label === Measurement.REPORT_LABEL_TOUCH) {
      this.measurement.touchMessagesSentPerSecond = (report.messagesSent - this.previousMeasurement.messagesSentTouch) / this.measurement.measureDuration;
      this.previousMeasurement.messagesSentTouch = report.messagesSent;
    }
  }

}

exports.default = Measurement;

Measurement.calculateStandardDeviation = (currentStats, previousStats) => {
  const deltaCount = currentStats.framesDecoded - previousStats.framesDecoded;

  if (deltaCount <= 0) {
    return undefined;
  }

  const deltaSquaredSum = currentStats.totalSquaredInterFrameDelay - previousStats.totalSquaredInterFrameDelay;
  const deltaSum = currentStats.totalInterFrameDelay - previousStats.totalInterFrameDelay;
  const variance = (deltaSquaredSum - Math.pow(deltaSum, 2) / deltaCount) / deltaCount;
  return Math.sqrt(Math.abs(variance)) * 1000;
};

Measurement.roundToDecimals = function (value) {
  let decimals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;

  if (value !== undefined) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  } else {
    return undefined;
  }
};