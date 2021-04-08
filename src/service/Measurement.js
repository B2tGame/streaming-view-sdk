import StreamingEvent from '../StreamingEvent';

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
   * @constructor
   */
  static get REPORT_TYPE_INBOUND_RTP() {
    return 'inbound-rtp';
  }

  /**
   *
   * @return {string}
   * @constructor
   */
  static get REPORT_TYPE_TRACK() {
    return 'track';
  }

  /**
   *
   * @return {string}
   * @constructor
   */
  static get REPORT_TYPE_DATA_CHANNEL() {
    return 'data-channel';
  }

  /**
   *
   * @return {string}
   * @constructor
   */
  static get REPORT_KIND_VIDEO() {
    return 'video';
  }

  /**
   *
   * @return {string}
   * @constructor
   */
  static get REPORT_LABEL_MOUSE() {
    return 'mouse';
  }

  /**
   *
   * @return {string}
   * @constructor
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
    });
    this.previousMeasurement.measureAt = this.measurement.measureAt;
    this.measurement.streamQualityRating = this.streamQualityRating || 0;

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
      this.measurement.predictedGameExperience = this.calculatePredictedGameExperience(this.measurement.packetsLostPercent);

      this.previousMeasurement.framesDecoded = report.framesDecoded;
      this.previousMeasurement.bytesReceived = report.bytesReceived;
      this.previousMeasurement.totalDecodeTime = report.totalDecodeTime;
      this.previousMeasurement.packetsLost = report.packetsLost;
      this.previousMeasurement.packetsReceived = report.packetsReceived;
    }
  }

  /**
   * Calculates a predicted game experience value based on packet lost percent
   * @param {number} packetLostPercent
   * @return {number}
   */
  calculatePredictedGameExperience(packetLostPercent) {
    if (packetLostPercent >= 5) {
      packetLostPercent = 1.0;
    } else if (packetLostPercent >= 2.5) {
      // y = 4 - 3/5 * x
      packetLostPercent = 4 - (3 / 5) * packetLostPercent;
    } else if (packetLostPercent >= 0) {
      // y = 5 - x
      packetLostPercent = 5 - packetLostPercent;
    } else {
      packetLostPercent = 5.0;
    }

    return packetLostPercent;
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
