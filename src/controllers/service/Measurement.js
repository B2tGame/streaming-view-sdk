import StreamingEvent from '../StreamingEvent';
import PredictGameExperience from '../../measurements/service/PredictGameExperience';
import PredictGameExperienceWithNeuralNetwork from './PredictGameExperienceWithNeuralNetwork';
import StreamWebRtc from './StreamWebRtc';
import StreamSocket from './StreamSocket';

import Classification from './Classification';

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
export default class Measurement {
  /**
   *
   * @param {string} edgeNodeId
   * @param {Logger} logger
   */
  constructor(edgeNodeId, streamingViewId, logger) {
    this.edgeNodeId = edgeNodeId;
    this.streamingViewId = streamingViewId;
    this.logger = logger;
    this.networkRoundTripTime = 0;
    this.webrtcRoundTripTime = 0;
    this.webrtcRoundTripTimeValues = [];
    this.didStreamResume = false;
    this.streamQualityRating = 0;
    this.numberOfBlackScreens = 0;
    this.previousMeasurement = this.defaultPreviousMeasurement();
    this.measurement = {};
    this.webRtcHost = undefined;
    this.webRtcIntervalHandler = undefined;
    this.classification = new Classification(streamingViewId, logger);

    this.isClassificationReportCreated = false;

    StreamingEvent.edgeNode(edgeNodeId)
      .on(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .on(StreamingEvent.TIME_OFFSET_MEASUREMENT, this.onTimeOffsetMeasurement)
      .on(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .on(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .on(StreamingEvent.STREAM_BLACK_SCREEN, this.onStreamBlackScreen)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected)
      .on(StreamingEvent.STREAM_TERMINATED, this.onStreamTerminated)
      .on(StreamingEvent.STREAM_RESUMED, this.onStreamResumed)
      .on(StreamingEvent.STREAM_PAUSED, this.onStreamPaused)
      .on(StreamingEvent.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration);
  }

  /**
   * @param {string} webRtcHost
   * @param {number} pingInterval
   * @param {{ name: string, candidates: [{*}] }} iceServers
   */
  initWebRtc(webRtcHost, pingInterval, iceServers = { name: 'default', candidates: [] }) {
    this.webRtcHost = webRtcHost;
    this.streamWebRtc = new StreamWebRtc(this.webRtcHost, iceServers, pingInterval);
    this.streamWebRtc.on(StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);
    StreamingEvent.edgeNode(this.edgeNodeId).on(StreamingEvent.STREAM_UNREACHABLE, this.streamWebRtc.close);
    this.webRtcIntervalHandler = setInterval(() => {
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
    this.logger.info('measurement module is destroyed');
    StreamingEvent.edgeNode(this.edgeNodeId)
      .off(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .off(StreamingEvent.TIME_OFFSET_MEASUREMENT, this.onTimeOffsetMeasurement)
      .off(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .off(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .off(StreamingEvent.STREAM_BLACK_SCREEN, this.onStreamBlackScreen)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected)
      .off(StreamingEvent.STREAM_RESUMED, this.onStreamResumed)
      .off(StreamingEvent.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration)
      .off(StreamingEvent.STREAM_TERMINATED, this.onStreamTerminated);

    this.createClassificationReport('destructor-called');

    if (this.webRtcIntervalHandler) {
      clearInterval(this.webRtcIntervalHandler);
      this.webRtcIntervalHandler = undefined;
    }
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

  onTimeOffsetMeasurement = (estimatedTimeOffset) => {
    this.estimatedTimeOffset = estimatedTimeOffset;
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
    this.createClassificationReport('stream-terminated');
  };

  createClassificationReport(reportTrigger) {
    StreamingEvent.edgeNode(this.edgeNodeId).emit(
      StreamingEvent.CLASSIFICATION_REPORT,
      this.classification.createClassificationReport(reportTrigger)
    );
  }

  onStreamResumed = () => {
    this.startClassificationRecording();
    this.didStreamResume = true;
  };

  onStreamPaused = () => {
    // Here we could probably stop recording measurements?
    if (this.didStreamResume) {
      this.createClassificationReport('stream-paused');
    }
  };

  /**
   *
   * @param {{ state: 'paused' | 'resumed' | 'terminated' | 'edge-node-crashed'}} payload
   *
   */
  onEmulatorConfiguration = (payload) => {
    if (payload.state === 'resumed') {
      this.startClassificationRecording();
      this.didStreamResume = true;
    }
  };

  startClassificationRecording() {
    if (!this.didStreamResume) {
      this.classification.startMeasurement();
      this.classification.registerMetricEventListener((evt) => {
        this.createClassificationReport(evt.type);
      });
    }
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
      measureAt: Date.now(),
    };
  }

  /**
   * Process reports from the browser and send report measurements to the StreamSocket by REPORT_MEASUREMENT event
   * @param {{ stats: RTCPeerConnection.getStats, synchronizationSource: RTCRtpContributingSource | null }}
   */
  reportWebRtcMeasurement({ stats, synchronizationSource }) {
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
    this.measurement.latestFrameClientTimestamp = (synchronizationSource || {}).timestamp;
    this.measurement.latestFrameRtpTimestamp = (synchronizationSource || {}).rtpTimestamp;
    this.measurement.estimatedTimeOffset = this.estimatedTimeOffset;

    // If predictedGameExperience is defined, report it as a float with 1 decimal
    if (this.measurement.predictedGameExperience) {
      StreamingEvent.edgeNode(this.edgeNodeId).emit(
        StreamingEvent.PREDICTED_GAME_EXPERIENCE,
        Measurement.roundToDecimals(this.measurement.predictedGameExperience[Measurement.PREDICTED_GAME_EXPERIENCE_DEFAULT], 1)
      );
    }

    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REPORT_MEASUREMENT, {
      networkRoundTripTime: this.networkRoundTripTime,
      extra: this.measurement,
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
      this.measurement.packetsLostPercent = (currentPacketsLost * 100) / (expectedPacketsReceived || 1);
      this.measurement.jitter = report.jitter;
      this.measurement.totalDecodeTimePerFramesDecodedInMs = Measurement.roundToDecimals(
        ((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) /
          (report.framesDecoded - this.previousMeasurement.framesDecoded)) *
          1000
      );
      this.measurement.interFrameDelayStandardDeviationInMs = Measurement.roundToDecimals(
        Measurement.calculateStandardDeviation(report, this.previousMeasurement)
      );

      if (report.estimatedPlayoutTimestamp) {
        // report.estimatedPlayoutTimestamp is in NTP time, i.e. the number of ms since 1900-01-01 00:00:00 (UTC).
        // We convert it to the number of ms since 1970-01-01 00:00:00 (UTC) to match report.timestamp.
        // There were 17 leap years between those dates, so we add 17 to the number of days.
        this.measurement.estimatedPlayoutTimestamp = report.estimatedPlayoutTimestamp - (70 * 365 + 17) * 24 * 60 * 60 * 1000;
      }

      this.previousMeasurement.framesDecoded = report.framesDecoded;
      this.previousMeasurement.bytesReceived = report.bytesReceived;
      this.previousMeasurement.totalDecodeTime = report.totalDecodeTime;
      this.previousMeasurement.totalInterFrameDelay = report.totalInterFrameDelay;
      this.previousMeasurement.totalSquaredInterFrameDelay = report.totalSquaredInterFrameDelay;
      this.previousMeasurement.packetsLost = report.packetsLost;
      this.previousMeasurement.packetsReceived = report.packetsReceived;
      this.previousMeasurement.jitter = report.jitter;

      this.classification.injectMeasurement(this.measurement.framesDecodedPerSecond, this.measurement.interFrameDelayStandardDeviationInMs);
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

    return Math.sqrt(Math.abs(variance)) * 1000;
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
   * @param {string} region
   * @return {{Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA: undefined|number, Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1: undefined|number}}
   */
  static calculatePredictedGameExperience(rtt, packetLostPercent, region = 'default') {
    if (Measurement.predictGameExperience === undefined) {
      Measurement.predictGameExperience = {};
    }
    if (Measurement.predictGameExperience[region] === undefined) {
      Measurement.predictGameExperience[region] = {};
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA] = new PredictGameExperience();
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1] = new PredictGameExperienceWithNeuralNetwork(
        require('./neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49')
      );
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
