import EventEmitter from 'eventemitter3';

/**
 * RtcReportHandler class handles EVENT_RTC_REPORT events and emits WEB_RTC_STATS on completion
 */
class RtcReportHandler extends EventEmitter {
  constructor() {
    super();

    let prev = {
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
    let logState = {};
    let timeSinceLast = undefined;

    function setLogState(params) {
      logState = { ...logState, ...params };
    }

    function setPrevAttributes(source, attributes) {
      attributes.map((attr) => (prev[attr] = source[attr]));
    }

    //EVENT_RTC_REPORT listeners are executed in a sequential order

    //Initialize state
    this.on('EVENT_RTC_REPORT', (stats) => {
      logState = {};
      timeSinceLast = (Date.now() - prev.timestamp) / 1000.0;
    });

    //Extract inbount-rtp:video logs
    this.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (prev.timestamp !== 0) {
            const framesDecodedPerSecond = (report.framesDecoded - prev.framesDecoded) / timeSinceLast;
            const bytesReceivedPerSecond = (report.bytesReceived - prev.bytesReceived) / timeSinceLast;
            const videoProcessing =
              report.framesDecoded - prev.framesDecoded !== 0
                ? (((report.totalDecodeTime || 0) - prev.totalDecodeTime) * 1000) / framesDecodedPerSecond
                : 0;

            setLogState({
              framesDecodedPerSecond: Math.trunc(framesDecodedPerSecond),
              bytesReceivedPerSecond: Math.trunc(bytesReceivedPerSecond),
              videoProcessing: report.totalDecodeTime ? Math.trunc(videoProcessing) : undefined,
            });
          }

          setPrevAttributes(report, ['bytesReceived', 'framesDecoded', 'totalDecodeTime']);
        }
      });
    });

    //Extract track:video logs
    this.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'track' && report.kind === 'video') {
          if (prev.timestamp !== 0) {
            const framesReceivedPerSecond = (report.framesReceived - prev.framesReceived) / timeSinceLast;
            const framesDroppedPerSecond = (report.framesDropped - prev.framesDropped) / timeSinceLast;
            const freezeCountPerSecond = (report.freezeCount - prev.freezeCount) / timeSinceLast;

            setLogState({
              framesReceivedPerSecond: Math.trunc(framesReceivedPerSecond),
              framesDroppedPerSecond: Math.trunc(framesDroppedPerSecond),
              freezeCountPerSecond: Math.trunc(freezeCountPerSecond),
            });
          }

          setPrevAttributes(report, ['framesReceived', 'framesDropped', 'freezeCount']);
        }
      });
    });

    //Extract data-channel:mouse logs
    this.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'data-channel' && report.label === 'mouse') {
          if (prev.timestamp !== 0) {
            const messagesSentMousePerSecond = (report.messagesSent - prev.messagesSentMouse) / timeSinceLast;
            setLogState({
              messagesSentMousePerSecond: Math.trunc(messagesSentMousePerSecond),
            });
          }
          prev.messagesSentMouse = report.messagesSent;
        }
      });
    });

    //Extract data-channel:touch logs
    this.on('EVENT_RTC_REPORT', (stats) => {
      stats.forEach((report) => {
        if (report.type === 'data-channel' && report.label === 'touch') {
          if (prev.timestamp !== 0) {
            const messagesSentTouchPerSecond = (report.messagesSent - prev.messagesSentTouch) / timeSinceLast;
            setLogState({
              messagesSentTouchPerSecond: Math.trunc(messagesSentTouchPerSecond),
            });
          }
          prev.messagesSentTouch = report.messagesSent;
        }
      });
    });

    //Emit WEB_RTC_STATS event with the merged log state
    this.on('EVENT_RTC_REPORT', (stats) => {
      prev.timestamp = Date.now();
      this.emit('WEB_RTC_STATS', {
        measureAt: Date.now(),
        measureDuration: Math.trunc(timeSinceLast),
        ...logState,
      });
    });
  }
}

export default RtcReportHandler;
