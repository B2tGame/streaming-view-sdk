import StreamingEvent from '../StreamingEvent';

/**
 * RollingWindow class
 */
class RollingWindow {
  constructor(sampleSize) {
    this.sampleSize = sampleSize;
    this.values = [];
  }

  add(value) {
    this.values.push(value);
    if (this.values.length > this.sampleSize) {
      this.values.shift();
    }
  }

  getValues() {
    return this.values;
  }

  getLastValue() {
    return this.values[this.values.length - 1];
  }
}

/**
 * RisingEdgeDetector class
 */
class RisingEdgeDetector {
  constructor() {
    this.isHigh = false;
  }

  next(value, threshold) {
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
}

/**
 * PredictGameExperience class
 */
class PredictGameExperience {
  constructor(
    sampleSize = 10,
    risingEdgeThreshold = 2.8,
    longTermSampleSizeMultiplier = 4,
    predictGameExperienceSampleSizeMultiple = 1.5,
    averageDetectionUpperRange = 0.25,
    stabilizationThreshold = 0.2,
    roundTripTimeRisingEdgeScore = 1.5, // 1
    packageLostPercentageRisingEdgeScore = 0, // 0.8
    maxRisingEdgeScore = 1.5,
    highRoundTripTimeGain = 150,
    highRoundTripTimeLowerThreshold = 0.5,
    risingEdgeCountGain = 0.7, // 0.6
    risingEdgeCountPower = 1.25,
    finalGain = 1.1
  ) {
    this.sampleSize = sampleSize;
    this.averageDetectionUpperRange = averageDetectionUpperRange;
    this.risingEdgeThreshold = risingEdgeThreshold;
    this.stabilizationThreshold = stabilizationThreshold;
    this.roundTripTimeRisingEdgeScore = roundTripTimeRisingEdgeScore;
    this.packageLostPercentageRisingEdgeScore = packageLostPercentageRisingEdgeScore;
    this.maxRisingEdgeScore = maxRisingEdgeScore;
    this.highRoundTripTimeGain = highRoundTripTimeGain;
    this.highRoundTripTimeLowerThreshold = highRoundTripTimeLowerThreshold;
    this.risingEdgeCountGain = risingEdgeCountGain;
    this.risingEdgeCountPower = risingEdgeCountPower;
    this.finalGain = finalGain;

    this.roundTripTimeLong = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeShort = new RollingWindow(sampleSize);
    this.roundTripTime = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.roundTripTimeRisingEdgeDetector = new RisingEdgeDetector();
    this.roundTripTimeRisingEdge = new RollingWindow(sampleSize);

    this.packageLostPercentage = new RollingWindow(sampleSize * longTermSampleSizeMultiplier);
    this.packageLostPercentageRisingEdgeDetector = new RisingEdgeDetector();
    this.packageLostPercentageRisingEdge = new RollingWindow(sampleSize);

    this.predictGameExperience = new RollingWindow(sampleSize * predictGameExperienceSampleSizeMultiple);
    this.count = 0;
  }

  predict(roundTripTime, packageLostPercentage) {
    this.count++;
    this.roundTripTimeLong.add(roundTripTime);
    this.roundTripTimeShort.add(roundTripTime);
    this.packageLostPercentage.add(packageLostPercentage);

    const roundTripTimeAverage = this.averageRange(this.roundTripTimeLong.getValues(), 0, this.averageDetectionUpperRange);
    const packageLostPercentageAverage = this.averageRange(this.packageLostPercentage.getValues(), 0, this.averageDetectionUpperRange);
    this.roundTripTimeRisingEdge.add(
      Math.min(
        this.roundTripTimeRisingEdgeDetector.next(roundTripTime, roundTripTimeAverage * this.risingEdgeThreshold) *
          this.roundTripTimeRisingEdgeScore +
          this.packageLostPercentageRisingEdgeDetector.next(
            packageLostPercentage,
            packageLostPercentageAverage * this.risingEdgeThreshold
          ) *
            this.packageLostPercentageRisingEdgeScore,
        this.maxRisingEdgeScore
      )
    );
    this.packageLostPercentageRisingEdge.add(
      this.packageLostPercentageRisingEdgeDetector.next(packageLostPercentage, packageLostPercentageAverage * this.risingEdgeThreshold)
    );
    const risingEdgeCount = this.sum(this.roundTripTimeRisingEdge.getValues());
    this.predictGameExperience.add(
      5 -
        Math.pow(risingEdgeCount * this.risingEdgeCountGain, this.risingEdgeCountPower) * this.finalGain +
        Math.min(this.highRoundTripTimeLowerThreshold - this.average(this.roundTripTimeShort.getValues()) / this.highRoundTripTimeGain, 0)
    );

    return this.count < this.sampleSize
      ? undefined
      : Math.min(Math.max(this.averageRange(this.predictGameExperience.getValues(), 0, this.stabilizationThreshold), 1), 5);
  }

  averageRange(dataset, lowerBound = 0, upperBound = 1) {
    const data = [...dataset].sort((a, b) => (a < b ? -1 : 1));
    return this.average(data.slice(Math.round((data.length - 1) * lowerBound), Math.round((data.length - 1) * upperBound)));
  }

  average(dataset) {
    return dataset.reduce((a, b) => a + b, 0) / dataset.length || 0;
  }

  sum(dataset) {
    return dataset.reduce((a, b) => a + b, 0);
  }
}

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
export default class Measurement {
  constructor(edgeNodeId) {
    this.edgeNodeId = edgeNodeId;
    this.networkRoundTripTime = 0;
    this.streamQualityRating = 0;
    this.previousMeasurement = this.defaultPreviousMeasurement();
    this.measurement = {};

    StreamingEvent.edgeNode(edgeNodeId)
      .on(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .on(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .on(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .on(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected);
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

  destroy() {
    StreamingEvent.edgeNode(this.edgeNodeId)
      .off(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement)
      .off(StreamingEvent.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement)
      .off(StreamingEvent.STREAM_QUALITY_RATING, this.onStreamQualityRating)
      .off(StreamingEvent.STREAM_DISCONNECTED, this.onStreamDisconnected);
  }

  onStreamQualityRating = (rating) => {
    this.streamQualityRating = rating.streamQualityRating;
  };

  onRoundTripTimeMeasurement = (networkRoundTripTime) => {
    this.networkRoundTripTime = networkRoundTripTime;
    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT);
  };

  onWebRtcMeasurement = (stats) => {
    this.reportWebRtcMeasurement(stats);
  };

  onStreamDisconnected = () => {
    this.previousMeasurement = this.defaultPreviousMeasurement();
  };

  /**
   * Return default values for previous measurement
   * @return {{messagesSentMouse: number, bytesReceived: number, framesReceived: number, messagesSentTouch: number, measureAt: number, totalDecodeTime: number, framesDecoded: number, framesDropped: null}}
   */
  defaultPreviousMeasurement() {
    return {
      framesDecoded: 0,
      bytesReceived: 0,
      totalDecodeTime: 0,
      framesReceived: 0,
      framesDropped: null,
      messagesSentMouse: 0,
      messagesSentTouch: 0,
      packetsLost: 0,
      packetsReceived: 0,
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
    this.previousMeasurement.measureAt = this.measurement.measureAt;
    this.measurement.streamQualityRating = this.streamQualityRating || 0;

    // If predictedGameExperience is defined, report it as a float with 1 decimal
    if (this.measurement.predictedGameExperience) {
      StreamingEvent.edgeNode(this.edgeNodeId).emit(
        StreamingEvent.PREDICTED_GAME_EXPERIENCE,
        Math.round(this.measurement.predictedGameExperience * 10) / 10
      );
    }

    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REPORT_MEASUREMENT, {
      networkRoundTripTime: this.networkRoundTripTime,
      extra: this.measurement
    });
    this.measurement = {};
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

      const currentPacketsLost = report.packetsLost - this.previousMeasurement.packetsLost;
      const currentPacketsReceived = report.packetsReceived - this.previousMeasurement.packetsReceived;
      const expectedPacketsReceived = currentPacketsLost + currentPacketsReceived;
      this.measurement.packetsLostPercent = (currentPacketsLost * 100) / expectedPacketsReceived;
      this.measurement.predictedGameExperience = this.calculatePredictedGameExperience(this.networkRoundTripTime, this.measurement.packetsLostPercent);;
      this.previousMeasurement.framesDecoded = report.framesDecoded;
      this.previousMeasurement.bytesReceived = report.bytesReceived;
      this.previousMeasurement.totalDecodeTime = report.totalDecodeTime;
      this.previousMeasurement.packetsLost = report.packetsLost;
      this.previousMeasurement.packetsReceived = report.packetsReceived;
    }
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
   * @return {number}
   */
  calculatePredictedGameExperience(rtt, packetLostPercent) {
    if (this.predictGameExperience === undefined) {
      this.predictGameExperience = new PredictGameExperience();
    }

    return this.predictGameExperience.predict(rtt, packetLostPercent);
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
