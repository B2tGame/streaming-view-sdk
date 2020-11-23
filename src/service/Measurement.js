/**
 * Listen on submeasurements and collect them into a measurement report and send it to the backend every 5 sec.
 */
import StreamingEvent from '../StreamingEvent';

export default class Measurement {

  constructor(edgeNodeId) {
    // Listen on submeasurements as Network RTT, WebRTC Stats
    // and collect the info for be able on a regular interval sending a report, eg as response of the network RTT or other timer function.


    //
    // this.props.streamSocket.on('pong', (networkRoundTripTime) => {
    //   this.props.streamSocket.emit(
    //     'message',
    //     JSON.stringify({
    //       type: 'report',
    //       timestamp: Date.now(),
    //       networkRoundTripTime: networkRoundTripTime,
    //       extra: { ...this.state.webrtcStats, ...this.state.streamQualityRating },
    //     }),
    //   );
    // });
    //
    // if (this.props.rtcReportHandler) {
    //   this.props.rtcReportHandler.on('WEB_RTC_STATS', (newValue) => {
    //     this.setState({ webrtcStats: newValue });
    //   });
    //
    //   this.props.rtcReportHandler.on('STREAM_QUALITY_RATING', (streamQualityRating) => {
    //     this.setState({ streamQualityRating: streamQualityRating });
    //   });
    // }


    //   const prev = {
    //     timestamp: 0,
    //     bytesReceived: 0,
    //     framesDecoded: 0,
    //     totalDecodeTime: 0,
    //     framesReceived: 0,
    //     framesDropped: 0,
    //     messagesSentMouse: 0,
    //     messagesSentTouch: 0,
    //   };
    //   let logState = {};
    //   let timeSinceLast = undefined;
    //
    //   function setLogState(params) {
    //     logState = { ...logState, ...params };
    //   }
    //
    //   function setPrevAttributes(source, attributes) {
    //     attributes.map((attr) => (prev[attr] = source[attr]));
    //   }
    //
    //   //EVENT_RTC_REPORT listeners are executed in a sequential order
    //
    //   //Initialize state
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     logState = {};
    //     timeSinceLast = (Date.now() - prev.timestamp) / 1000.0;
    //   });
    //
    //   //Extract inbount-rtp:video logs
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     stats.forEach((report) => {
    //       if (report.type === 'inbound-rtp' && report.kind === 'video') {
    //         if (prev.timestamp !== 0) {
    //           const framesDecodedPerSecond = (report.framesDecoded - prev.framesDecoded) / timeSinceLast;
    //           const bytesReceivedPerSecond = (report.bytesReceived - prev.bytesReceived) / timeSinceLast;
    //           const videoProcessing =
    //             report.framesDecoded - prev.framesDecoded !== 0
    //               ? (((report.totalDecodeTime || 0) - prev.totalDecodeTime) * 1000) / framesDecodedPerSecond
    //               : 0;
    //
    //           setLogState({
    //             framesDecodedPerSecond: framesDecodedPerSecond,
    //             bytesReceivedPerSecond: bytesReceivedPerSecond,
    //             videoProcessing: report.totalDecodeTime ? videoProcessing : undefined,
    //           });
    //         }
    //
    //         setPrevAttributes(report, ['bytesReceived', 'framesDecoded', 'totalDecodeTime']);
    //       }
    //     });
    //   });
    //
    //   //Extract track:video logs
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     stats.forEach((report) => {
    //       if (report.type === 'track' && report.kind === 'video') {
    //         if (prev.timestamp !== 0) {
    //           const framesReceivedPerSecond = (report.framesReceived - prev.framesReceived) / timeSinceLast;
    //           const framesDroppedPerSecond = (report.framesDropped - prev.framesDropped) / timeSinceLast;
    //
    //           setLogState({
    //             framesReceivedPerSecond: framesReceivedPerSecond,
    //             framesDroppedPerSecond: framesDroppedPerSecond,
    //           });
    //         }
    //
    //         setPrevAttributes(report, ['framesReceived', 'framesDropped']);
    //       }
    //     });
    //   });
    //
    //   //Extract data-channel:mouse logs
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     stats.forEach((report) => {
    //       if (report.type === 'data-channel' && report.label === 'mouse') {
    //         if (prev.timestamp !== 0) {
    //           const mouseMessagesSentPerSecond = (report.messagesSent - prev.messagesSentMouse) / timeSinceLast;
    //           setLogState({
    //             mouseMessagesSentPerSecond: mouseMessagesSentPerSecond,
    //           });
    //         }
    //         prev.messagesSentMouse = report.messagesSent;
    //       }
    //     });
    //   });
    //
    //   //Extract data-channel:touch logs
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     stats.forEach((report) => {
    //       if (report.type === 'data-channel' && report.label === 'touch') {
    //         if (prev.timestamp !== 0) {
    //           const touchMessagesSentPerSecond = (report.messagesSent - prev.messagesSentTouch) / timeSinceLast;
    //           setLogState({
    //             touchMessagesSentPerSecond: touchMessagesSentPerSecond,
    //           });
    //         }
    //         prev.messagesSentTouch = report.messagesSent;
    //       }
    //     });
    //   });
    //
    //   //Emit WEB_RTC_STATS event with the merged log state
    //   this.on('EVENT_RTC_REPORT', (stats) => {
    //     prev.timestamp = Date.now();
    //     this.emit('WEB_RTC_STATS', {
    //       measureAt: Date.now(),
    //       measureDuration: Math.round(timeSinceLast),
    //       ...logState,
    //     });
    //   });
    // }
  }

}