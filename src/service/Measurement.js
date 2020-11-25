import StreamingEvent from '../StreamingEvent';

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
export default class Measurement {
  constructor(edgeNodeId) {
    this.edgeNodeId = edgeNodeId;
    this.networkRoundTripTime = 0;

    this.previousMeasurement = {
      framesDecoded: 0,
      bytesReceived: 0,
      totalDecodeTime: 0,
      framesReceived: 0,
      framesDropped: 0,
      messagesSentMouse: 0,
      messagesSentTouch: 0,
      measureAt: 0,
    };

    this.measurement = {};

    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.STREAM_CONNECTED, () => {
      // Store timestamp, when peer connection was established
      this.previousMeasurement.measureAt = Date.now();
    });

    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT, (networkRoundTripTime) => {
      this.networkRoundTripTime = networkRoundTripTime;
      StreamingEvent.edgeNode(edgeNodeId).emit(StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT);
    });

    StreamingEvent.edgeNode(edgeNodeId).on(StreamingEvent.WEB_RTC_MEASUREMENT, (stats) =>
      this.reportWebRtcMeasurement(stats)
    );

    // TODO: Destroy method
  }

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
    this.measurement.measureDuration = Math.round(this.measurement.measureDuration);

    StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.REPORT_MEASUREMENT, {
      networkRoundTripTime: this.networkRoundTripTime,
      extra: this.measurement,
    });

    this.measurement = {};
  }

  /**
   * Process inbound-rtp video report to fetch framesDecodedPerSecond, bytesReceivedPerSecond and videoProcessing
   * @param report
   */
  processInboundRtpVideoReport(report) {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      this.measurement.framesDecodedPerSecond =
        (report.framesDecoded - this.previousMeasurement.framesDecoded) / this.measurement.measureDuration;
      this.measurement.bytesReceivedPerSecond =
        (report.bytesReceived - this.previousMeasurement.bytesReceived) / this.measurement.measureDuration;
      this.measurement.videoProcessing =
        report.framesDecoded - this.previousMeasurement.framesDecoded !== 0
          ? (((report.totalDecodeTime || 0) - this.previousMeasurement.totalDecodeTime) * 1000) /
            this.measurement.measureDuration
          : 0;

      this.previousMeasurement.framesDecoded = report.framesDecoded;
      this.previousMeasurement.bytesReceived = report.bytesReceived;
      this.previousMeasurement.totalDecodeTime = report.totalDecodeTime;
    }
  }

  /**
   * Process track video report to fetch framesReceivedPerSecond and framesDroppedPerSecond
   * @param report
   */
  processTrackVideoReport(report) {
    if (report.type === 'track' && report.kind === 'video') {
      this.measurement.framesReceivedPerSecond =
        (report.framesReceived - this.previousMeasurement.framesReceived) / this.measurement.measureDuration;
      this.measurement.framesDroppedPerSecond =
        (report.framesDropped - this.previousMeasurement.framesDropped) / this.measurement.measureDuration;

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
    if (report.type === 'data-channel' && report.label === 'mouse') {
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
    if (report.type === 'data-channel' && report.label === 'touch') {
      this.measurement.touchMessagesSentPerSecond =
        (report.messagesSent - this.previousMeasurement.messagesSentTouch) / this.measurement.measureDuration;
      this.previousMeasurement.messagesSentTouch = report.messagesSent;
    }
  }
}
