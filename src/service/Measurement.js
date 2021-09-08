import StreamingEvent from '../StreamingEvent';
import PredictGameExperience from './PredictGameExperience';
import PredictGameExperienceWithNeuralNetwork from './PredictGameExperienceWithNeuralNetwork';
import StreamWebRtc from './StreamWebRtc';
import StreamSocket from './StreamSocket';
import Metric from './Metric';
import FramePerSecondHistogram from './FramePerSecondHistogram';

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
export default class Measurement {
  /**
   *
   * @param {string} edgeNodeId
   */
  constructor(edgeNodeId) {
    this.edgeNodeId = edgeNodeId;
    this.networkRoundTripTime = 0;
    this.webrtcRoundTripTime = 0;
    this.webrtcRoundTripTimeValues = [];
    this.streamQualityRating = 0;
    this.numberOfBlackScreens = 0;
    this.previousMeasurement = this.defaultPreviousMeasurement();
    this.measurement = {};
    this.webRtcHost = undefined;
    this.metricsFramesDecodedPerSecond = new Metric();
    this.metricsInterFrameDelayStandardDeviation = new Metric();
    this.framesDecodedPerSecondHistogram = new FramePerSecondHistogram();
    this.isClassificationReportCreated = false;

    StreamingEvent.edgeNode(edgeNodeId)
      .on(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .on(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .on(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .on(StreamingEvent.STREAM_BLACK_SCREEN, this.onStreamBlackScreen)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected)
      .on(StreamingEvent.STREAM_TERMINATED, this.onStreamTerminated)
      .on(StreamingEvent.STREAM_RESUMED, this.onStreamResumed)
      .on(StreamingEvent.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration);

  }

  /**
   * @param {string} webRtcHost
   * @param {number} pingInterval
   */
  initWebRtc(webRtcHost, pingInterval) {
    this.webRtcHost = webRtcHost;
    this.streamWebRtc = new StreamWebRtc(webRtcHost, pingInterval);
    this.streamWebRtc.on(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);
    StreamingEvent.edgeNode(this.edgeNodeId).on(StreamingEvent.STREAM_UNREACHABLE, this.streamWebRtc.close);
    setInterval(() => {
      StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT);
    }, StreamSocket.WEBSOCKET_PING_INTERVAL);
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
    StreamingEvent.edgeNode(this.edgeNodeId)
      .off(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .off(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .off(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .off(StreamingEvent.STREAM_BLACK_SCREEN, this.onStreamBlackScreen)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected)
      .off(StreamingEvent.STREAM_RESUMED, this.onStreamResumed)
      .off(StreamingEvent.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration)
      .off(StreamingEvent.STREAM_TERMINATED, this.onStreamTerminated);
    this.createClassificationReport();
    if (this.streamWebRtc) {
      StreamingEvent.edgeNode(this.edgeNodeId).off(StreamingEvent.STREAM_UNREACHABLE, this.streamWebRtc.close);
      this.streamWebRtc.off(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);
      this.streamWebRtc.close();
    }
  }

  onStreamQualityRating = (rating) => {
    this.streamQualityRating = rating.streamQualityRating;
  };

  onStreamBlackScreen = () => {
    this.numberOfBlackScreens += 1;
  };

  onRoundTripTimeMeasurement = (networkRoundTripTime) => {
    this.networkRoundTripTime = networkRoundTripTime;
  };

  onWebRtcRoundTripTimeMeasurement = (webrtcRoundTripTime) => {
    this.webrtcRoundTripTimeValues.push(webrtcRoundTripTime);
  };

  onWebRtcMeasurement = (stats) => {
    this.reportWebRtcMeasurement(stats);
  };

  onStreamDisconnected = () => {
    this.previousMeasurement = this.defaultPreviousMeasurement();
  };

  onStreamTerminated = () => {
    this.createClassificationReport();
  };

  createClassificationReport() {
    if (this.isClassificationReportCreated) {
      return;
    }
    this.isClassificationReportCreated = true;

    const framesDecodedPerSecondStart = this.metricsFramesDecodedPerSecond.getMetric(Metric.START);
    const framesDecodedPerSecondBeginning = this.metricsFramesDecodedPerSecond.getMetric(Metric.BEGINNING);
    const framesDecodedPerSecondOverall = this.metricsFramesDecodedPerSecond.getMetric(Metric.OVERALL);
    const framesDecodedPerSecondCurrent = this.metricsFramesDecodedPerSecond.getMetric(Metric.CURRENT);

    const interFrameDelayStandardDeviationStart = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.START);
    const interFrameDelayStandardDeviationBeginning = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.BEGINNING);
    const interFrameDelayStandardDeviationOverall = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.OVERALL);
    const interFrameDelayStandardDeviationCurrent = this.metricsInterFrameDelayStandardDeviation.getMetric(Metric.CURRENT);

    const classification = () => {
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
      if (
        framesDecodedPerSecondStart < 45 &&
        framesDecodedPerSecondBeginning < 45 &&
        (framesDecodedPerSecondOverall || 0) < 45
      ) {
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
      if (
        framesDecodedPerSecondOverall < 45 || interFrameDelayStandardDeviationOverall > 15
      ) {
        return 'consistent-slow-motion-detected';
      }

      return 'no-classification-detected';
    };

    StreamingEvent.edgeNode(this.edgeNodeId)
      .emit(
        StreamingEvent.CLASSIFICATION_REPORT,
        {
          classification: classification(),
          duration: this.metricsFramesDecodedPerSecond.getReferenceTime(),
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
        }
      );
  }

  onStreamResumed = () => {
    if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
      this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
      this.metricsFramesDecodedPerSecond.setReferenceTime();
      this.framesDecodedPerSecondHistogram.addSeparator();
    }
  };

  onEmulatorConfiguration = (payload) => {
    if (payload.state !== 'paused') {
      if (!this.metricsFramesDecodedPerSecond.hasReferenceTime()) {
        this.metricsInterFrameDelayStandardDeviation.setReferenceTime();
        this.metricsFramesDecodedPerSecond.setReferenceTime();
        this.framesDecodedPerSecondHistogram.addSeparator();
      }
    }
  };

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
    this.measurement.measureDuration = (this.measurement.measureAt - this.previousMeasurement.measureAt) / 1000;
    // Process all reports and collect measurement data
    stats.forEach((report) => {
      this.processInboundRtpVideoReport(report);
      this.processTrackVideoReport(report);
      this.processDataChannelMouseReport(report);
      this.processDataChannelTouchReport(report);
      this.processCandidatePairReport(report);
    });
    this.processWebRtcRoundTripTimeStats();
    this.previousMeasurement.measureAt = this.measurement.measureAt;
    this.measurement.streamQualityRating = this.streamQualityRating || 0;
    this.measurement.numberOfBlackScreens = this.numberOfBlackScreens || 0;

    // If predictedGameExperience is defined, report it as a float with 1 decimal
    if (this.measurement.predictedGameExperience) {
      StreamingEvent.edgeNode(this.edgeNodeId).emit(
        StreamingEvent.PREDICTED_GAME_EXPERIENCE,
        Measurement.roundToDecimals(this.measurement.predictedGameExperience[Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT], 1)
      );
    }

    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REPORT_MEASUREMENT, {
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
      this.measurement.framesDecodedPerSecond =
        (report.framesDecoded - this.previousMeasurement.framesDecoded) / this.measurement.measureDuration;
      this.measurement.bytesReceivedPerSecond =
        (report.bytesReceived - this.previousMeasurement.bytesReceived) / this.measurement.measureDuration;
      this.measurement.videoProcessing =
        report.framesDecoded - this.previousMeasurement.framesDecoded !== 0
          ? (((report.totalDecodeTime || 0) - this.previousMeasurement.totalDecodeTime) * 1000) / this.measurement.framesDecodedPerSecond
          : 0;
      this.measurement.totalDecodeTimePerSecond = Measurement.roundToDecimals(
        (report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) / this.measurement.measureDuration
      );
      this.measurement.totalInterFrameDelayPerSecond = Measurement.roundToDecimals(
        (report.totalInterFrameDelay - this.previousMeasurement.totalInterFrameDelay) / this.measurement.measureDuration
      );

      const currentPacketsLost = report.packetsLost - this.previousMeasurement.packetsLost;
      const currentPacketsReceived = report.packetsReceived - this.previousMeasurement.packetsReceived;
      const expectedPacketsReceived = currentPacketsLost + currentPacketsReceived;
      this.measurement.packetsLostPercent = (currentPacketsLost * 100) / expectedPacketsReceived;
      this.measurement.jitter = report.jitter;
      this.measurement.totalDecodeTimePerFramesDecodedInMs = Measurement.roundToDecimals(
        ((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) /
          (report.framesDecoded - this.previousMeasurement.framesDecoded)) *
        1000
      );
      this.measurement.interFrameDelayStandardDeviationInMs = Measurement.roundToDecimals(
        Measurement.calculateStandardDeviation(report, this.previousMeasurement)
      );

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
  static calculateStandardDeviation = (currentStats, previousStats) => {
    const deltaCount = currentStats.framesDecoded - previousStats.framesDecoded;
    if (deltaCount <= 0) {
      return undefined;
    }

    const deltaSquaredSum = currentStats.totalSquaredInterFrameDelay - previousStats.totalSquaredInterFrameDelay;
    const deltaSum = currentStats.totalInterFrameDelay - previousStats.totalInterFrameDelay;
    const variance = (deltaSquaredSum - Math.pow(deltaSum, 2) / deltaCount) / deltaCount;
    if (variance < 0) {
      return undefined;
    }
    return Math.sqrt(variance) * 1000;
  };

  /**
   * Round a given number to a specified decimals
   * @param {number} value The value to round
   * @param {number} decimals Number of decimals to round to, defaults to 3.
   * @return {number} The rounded value
   */
  static roundToDecimals = (value, decimals = 3) => {
    if (value !== undefined) {
      const multiplier = Math.pow(10, decimals);
      return Math.round(value * multiplier) / multiplier;
    } else {
      return undefined;
    }
  };

  processWebRtcRoundTripTimeStats() {
    this.webrtcRoundTripTime = StreamWebRtc.calculateRoundTripTimeStats(this.webrtcRoundTripTimeValues).rtt;
    this.webrtcRoundTripTimeValues = [];
    this.measurement.predictedGameExperience = Measurement.calculatePredictedGameExperience(
      this.networkRoundTripTime,
      this.measurement.packetsLostPercent
    );
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
   * @return {{Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA: undefined|number, Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1: undefined|number}}
   */
  static calculatePredictedGameExperience(rtt, packetLostPercent) {
    if (Measurement.predictGameExperience === undefined) {
      Measurement.predictGameExperience = {};
      Measurement.predictGameExperience[Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA] = new PredictGameExperience();
      Measurement.predictGameExperience[Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1] = new PredictGameExperienceWithNeuralNetwork(
        require('./neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49')
      );
    }

    return Measurement.PREDICTED_GAME_EXPERIENCE_ALGORITHMS.reduce((result, algorithm) => {
      result[algorithm] = Measurement.predictGameExperience[algorithm].predict(rtt, packetLostPercent);
      return result;
    }, {});
  }

  /**
   * Process track video report to fetch framesReceivedPerSecond and framesDropped
   * @param report
   */
  processTrackVideoReport(report) {
    if (report.type === Measurement.REPORT_TYPE_TRACK && report.kind === Measurement.REPORT_KIND_VIDEO) {
      this.measurement.framesReceivedPerSecond =
        (report.framesReceived - this.previousMeasurement.framesReceived) / this.measurement.measureDuration;
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
      this.measurement.mouseMessagesSentPerSecond =
        (report.messagesSent - this.previousMeasurement.messagesSentMouse) / this.measurement.measureDuration;
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
      this.measurement.touchMessagesSentPerSecond =
        (report.messagesSent - this.previousMeasurement.messagesSentTouch) / this.measurement.measureDuration;
      this.previousMeasurement.messagesSentTouch = report.messagesSent;
    }
  }
}
