import MessageEmitter from '../MessageEmitter';

/**
 * RtcReportHandler class handles EVENT_RTC_REPORT events and emits WEB_RTC_STATS on completion
 */
class RtcReportHandler {
  setLogState = (params) => {
    this.logState = { ...this.logState, ...params };
  };

  setPrevAttributes = (source, attributes) => {
    attributes.map((attr) => (this.prev[attr] = source[attr]));
  };

  constructor() {
    this.prev = {
      timestamp: 0,
      bytesReceived: 0,
      framesDecoded: 0,
      totalDecodeTime: 0,
      framesReceived: 0,
      framesDropped: 0,
      freezeCount: 0,
      messagesSentMouse: 0,
      messagesSentTouch: 0,
    };

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      this.logState = {};
      this.timeSinceLast = (Date.now() - this.prev.timestamp) / 1000.0;
    });

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (this.prev.timestamp !== 0) {
            const framesDecodedPerSecond = (report.framesDecoded - this.prev.framesDecoded) / this.timeSinceLast;
            const bytesReceivedPerSecond = (report.bytesReceived - this.prev.bytesReceived) / this.timeSinceLast;
            const videoProcessing =
              report.framesDecoded - this.prev.framesDecoded !== 0
                ? (((report.totalDecodeTime || 0) - this.prev.totalDecodeTime) * 1000) / framesDecodedPerSecond
                : 0;

            this.setLogState({
              framesDecodedPerSecond: Math.trunc(framesDecodedPerSecond),
              bytesReceivedPerSecond: Math.trunc(bytesReceivedPerSecond),
              videoProcessing: report.totalDecodeTime ? Math.trunc(videoProcessing) : undefined,
            });
          }

          this.setPrevAttributes(report, ['bytesReceived', 'framesDecoded', 'totalDecodeTime']);
        }
      });
    });

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'track' && report.kind === 'video') {
          if (this.prev.timestamp !== 0) {
            const framesReceivedPerSecond = (report.framesReceived - this.prev.framesReceived) / this.timeSinceLast;
            const framesDroppedPerSecond = (report.framesDropped - this.prev.framesDropped) / this.timeSinceLast;
            const freezeCountPerSecond = (report.freezeCount - this.prev.freezeCount) / this.timeSinceLast;

            this.setLogState({
              framesReceivedPerSecond: Math.trunc(framesReceivedPerSecond),
              framesDroppedPerSecond: Math.trunc(framesDroppedPerSecond),
              freezeCountPerSecond: Math.trunc(freezeCountPerSecond),
            });
          }

          this.setPrevAttributes(report, ['framesReceived', 'framesDropped', 'freezeCount']);
        }
      });
    });

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'data-channel' && report.label === 'mouse') {
          if (this.prev.timestamp !== 0) {
            const messagesSentMousePerSecond = (report.messagesSent - this.prev.messagesSentMouse) / this.timeSinceLast;
            this.setLogState({
              messagesSentMousePerSecond: Math.trunc(messagesSentMousePerSecond),
            });
          }
          this.prev.messagesSentMouse = report.messagesSent;
        }
      });
    });

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'data-channel' && report.label === 'touch') {
          if (this.prev.timestamp !== 0) {
            const messagesSentTouchPerSecond = (report.messagesSent - this.prev.messagesSentTouch) / this.timeSinceLast;
            this.setLogState({
              messagesSentTouchPerSecond: Math.trunc(messagesSentTouchPerSecond),
            });
          }
          this.prev.messagesSentTouch = report.messagesSent;
        }
      });
    });

    MessageEmitter.on('EVENT_RTC_REPORT', (stats) => {
      this.prev.timestamp = Date.now();
      MessageEmitter.emit('WEB_RTC_STATS', {
        measureAt: Date.now(),
        measureDuration: Math.trunc(this.timeSinceLast),
        ...this.logState,
      });
    });
  }
}

export default RtcReportHandler;
