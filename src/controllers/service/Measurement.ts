import * as StreamingEvent from '../StreamingEvent';
import PredictGameExperience from '../../measurements/service/PredictGameExperience';
import PredictGameExperienceWithNeuralNetwork from './PredictGameExperienceWithNeuralNetwork';
import * as StreamWebRtc from '../../measurements/service/StreamWebRtc';
import StreamSocket, { EmulatorConfiguration } from './StreamSocket';

import Classification from './Classification';
import { Logger } from '../../measurements/Logger';
import { IceServerInfo } from './IceServer';
import neuralModel from './neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49.json';

type MeasurementData = {
  measureDuration: number;
  streamQualityRating: number;
  numberOfBlackScreens: number;
  latestFrameClientTimestamp: number;
  latestFrameRtpTimestamp: number;
  estimatedTimeOffset: number;
  predictedGameExperience: { [key: string]: number };
  rttStatsByRegionByTurn: { [key: string]: { [key: string]: number } };
  framesReceivedPerSecond: number;
  jitterBufferDelay: number;
  jitterBufferEmittedCount: number;
  framesDecodedPerSecond: number;
  bytesReceivedPerSecond: number;
  videoProcessing: number;
  totalDecodeTimePerSecond: number;
  totalInterFrameDelayPerSecond: number;
  packetsLostPercent: number;
  totalDecodeTimePerFramesDecodedInMs: number;
  interFrameDelayStandardDeviationInMs: number;
  webrtcRoundTripTime: number;
  webrtcCurrentRoundTripTime: number;
  mouseMessagesSentPerSecond: number;
  touchMessagesSentPerSecond: number;
  firstShownFrameUnixTimestampMs: number;
  shownFrameDeltasMs: number[];
} & PreviousMeasurementData;

type PreviousMeasurementData = {
  framesDecoded: number;
  bytesReceived: number;
  totalDecodeTime: number;
  totalInterFrameDelay: number;
  totalSquaredInterFrameDelay: number;
  framesReceived: number;
  framesDropped?: number;
  messagesSentMouse: number;
  messagesSentTouch: number;
  packetsLost: number;
  packetsReceived: number;
  jitter?: number;
  lastFrameShownTimestamp?: number;
  measureAt: number;
};

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
export default class Measurement {
  networkRoundTripTime = 0;
  webrtcRoundTripTime = 0;
  webrtcRoundTripTimeValues: number[] = [];
  didStreamResume = false;
  streamQualityRating = 0;
  numberOfBlackScreens = 0;
  measurement: MeasurementData;
  isClassificationReportCreated = false;

  webRtcHost?: string;
  webRtcIntervalHandlerId: number;

  estimatedTimeOffset: number;
  previousMeasurement: PreviousMeasurementData;
  classification: Classification;

  closeStreamWebRtc: () => void;

  /**
   *
   * @param {string} edgeNodeId
   * @param {Logger} logger
   */
  constructor(public edgeNodeId: string, public streamingViewId: string, public logger: Logger) {
    this.previousMeasurement = this.defaultPreviousMeasurement();
    this.classification = new Classification(streamingViewId, logger);

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
   * @param  iceServers
   */
  async initWebRtc(webRtcHost: string, iceServers: IceServerInfo = { name: 'default', candidates: [] }) {
    this.webRtcHost = webRtcHost;

    this.closeStreamWebRtc = await StreamWebRtc.initRttMeasurement({
      host: `${webRtcHost}/${iceServers.name}`,
      iceServerCandidates: iceServers.candidates,
      onRttMeasure: (rtt: number) => this.onWebRtcRoundTripTimeMeasurement(rtt),
    });

    StreamingEvent.edgeNode(this.edgeNodeId).on(StreamingEvent.STREAM_UNREACHABLE, this.closeStreamWebRtc);
    this.webRtcIntervalHandlerId = window.setInterval(() => {
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

    if (this.webRtcIntervalHandlerId) {
      window.window.clearInterval(this.webRtcIntervalHandlerId);
      this.webRtcIntervalHandlerId = -1;
    }

    this.closeStreamWebRtc && this.closeStreamWebRtc();
  }

  onStreamQualityRating = (rating: StreamingEvent.STREAM_QUALITY_RATING_PAYLOAD[0]) => {
    this.streamQualityRating = rating.streamQualityRating!;
  };

  onStreamBlackScreen = () => {
    this.numberOfBlackScreens += 1;
  };

  onRoundTripTimeMeasurement = (networkRoundTripTime: number) => {
    this.networkRoundTripTime = networkRoundTripTime;
  };

  onTimeOffsetMeasurement = (estimatedTimeOffset: number) => {
    this.estimatedTimeOffset = estimatedTimeOffset;
  };

  onWebRtcRoundTripTimeMeasurement = (webrtcRoundTripTime: number) => {
    this.webrtcRoundTripTimeValues.push(webrtcRoundTripTime);
  };

  onWebRtcMeasurement = (stats: StreamingEvent.WEB_RTC_MEASUREMENT_PAYLOAD[0]) => {
    this.reportWebRtcMeasurement(stats);
  };

  onStreamDisconnected = () => {
    this.previousMeasurement = this.defaultPreviousMeasurement();
  };

  onStreamTerminated = () => {
    this.createClassificationReport('stream-terminated');
  };

  createClassificationReport(reportTrigger: string) {
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
   * @param payload
   *
   */
  onEmulatorConfiguration = (payload: EmulatorConfiguration) => {
    if (payload.state === 'resumed') {
      this.startClassificationRecording();
      this.didStreamResume = true;
    }
  };

  startClassificationRecording() {
    if (!this.didStreamResume) {
      this.classification.startMeasurement();
      this.classification.registerMetricEventListener((evt: CustomEvent<any>) => {
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
      messagesSentMouse: 0,
      messagesSentTouch: 0,
      packetsLost: 0,
      packetsReceived: 0,
      measureAt: Date.now(),
    };
  }

  /**
   * Process reports from the browser and send report measurements to the StreamSocket by REPORT_MEASUREMENT event
   * @param {{ stats: RTCPeerConnection.getStats, synchronizationSource: RTCRtpContributingSource | null }}
   */
  reportWebRtcMeasurement({ stats, synchronizationSource, frameTimestamps }: StreamingEvent.WEB_RTC_MEASUREMENT_PAYLOAD[0]) {
    this.measurement.measureAt = Date.now();
    this.measurement.measureDuration = (this.measurement.measureAt - this.previousMeasurement.measureAt) / 1000;
    // Process all reports and collect measurement data
    stats.forEach((report) => {
      this.processInboundRtpVideoReport(report);
      this.processDataChannelMouseReport(report);
      this.processDataChannelTouchReport(report);
      this.processCandidatePairReport(report);
    });
    this.processWebRtcRoundTripTimeStats();
    this.processFrameTimestamps(frameTimestamps);
    this.previousMeasurement.measureAt = this.measurement.measureAt;
    this.measurement.streamQualityRating = this.streamQualityRating || 0;
    this.measurement.numberOfBlackScreens = this.numberOfBlackScreens || 0;
    this.measurement.latestFrameClientTimestamp = synchronizationSource?.timestamp!;
    this.measurement.latestFrameRtpTimestamp = synchronizationSource?.rtpTimestamp!;
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
      // @ts-ignore
      extra: this.measurement,
    });
    // @ts-ignore
    this.measurement = {};
    this.numberOfBlackScreens = 0;
  }

  /**
   * Process inbound-rtp video report to fetch its metrics
   * @param report
   */
  processInboundRtpVideoReport(report: any) {
    if (report.type === Measurement.REPORT_TYPE_INBOUND_RTP && report.kind === Measurement.REPORT_KIND_VIDEO) {
      this.measurement.framesReceivedPerSecond =
        (report.framesReceived - this.previousMeasurement.framesReceived) / this.measurement.measureDuration;
      this.measurement.framesDropped = report.framesDropped - this.previousMeasurement.framesDropped!;
      this.measurement.jitterBufferDelay = report.jitterBufferDelay * 1000;
      this.measurement.jitterBufferEmittedCount = report.jitterBufferEmittedCount;

      this.previousMeasurement.framesReceived = report.framesReceived;
      this.previousMeasurement.framesDropped = report.framesDropped;
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
      )!;
      this.measurement.totalInterFrameDelayPerSecond = Measurement.roundToDecimals(
        (report.totalInterFrameDelay - this.previousMeasurement.totalInterFrameDelay) / this.measurement.measureDuration
      )!;

      const currentPacketsLost = report.packetsLost - this.previousMeasurement.packetsLost;
      const currentPacketsReceived = report.packetsReceived - this.previousMeasurement.packetsReceived;
      const expectedPacketsReceived = currentPacketsLost + currentPacketsReceived;
      this.measurement.packetsLostPercent = (currentPacketsLost * 100) / (expectedPacketsReceived || 1);
      this.measurement.jitter = report.jitter;
      this.measurement.totalDecodeTimePerFramesDecodedInMs = Measurement.roundToDecimals(
        ((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) /
          (report.framesDecoded - this.previousMeasurement.framesDecoded)) *
          1000
      )!;
      this.measurement.interFrameDelayStandardDeviationInMs = Measurement.roundToDecimals(
        Measurement.calculateStandardDeviation(report, this.previousMeasurement)!
      )!;

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
   * @param {} currentStats
   * @param {} previousStats
   * @return {number|undefined} Standard deviation value
   */
  static calculateStandardDeviation = (currentStats: MeasurementData, previousStats: PreviousMeasurementData) => {
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
   * @param value The value to round
   * @param decimals Number of decimals to round to, defaults to 3.
   * @return The rounded value
   */
  static roundToDecimals = (value: number, decimals: number = 3) => {
    if (value !== undefined) {
      const multiplier = Math.pow(10, decimals);
      return Math.round(value * multiplier) / multiplier;
    } else {
      return undefined;
    }
  };

  async processWebRtcRoundTripTimeStats() {
    this.webrtcRoundTripTime = StreamWebRtc.calculateRoundTripTimeStats(this.webrtcRoundTripTimeValues).rtt;
    this.webrtcRoundTripTimeValues = [];
    this.measurement.predictedGameExperience = await Measurement.calculatePredictedGameExperience(
      this.networkRoundTripTime,
      this.measurement.packetsLostPercent
    );
    this.measurement.webrtcRoundTripTime = this.webrtcRoundTripTime;
  }

  /**
   * Process candidate-pair report to fetch currentRoundTripTime
   * @param report
   */
  processCandidatePairReport(report: any) {
    if (report.type === Measurement.REPORT_TYPE_CANDIDATE_PAIR && report.writable === true) {
      this.measurement.webrtcCurrentRoundTripTime = report.currentRoundTripTime * 1000;
    }
  }

  /**
   * Calculates a predicted game experience value based on rtt and packet lost percent
   * @param  rtt
   * @param packetLostPercent
   * @param region
   */
  static async calculatePredictedGameExperience(rtt: number, packetLostPercent: number, region = 'default') {
    // @ts-ignore
    if (Measurement.predictGameExperience === undefined) {
      // @ts-ignore
      Measurement.predictGameExperience = {};
    }
    // @ts-ignore
    if (Measurement.predictGameExperience[region] === undefined) {
      // @ts-ignore
      Measurement.predictGameExperience[region] = {};
      // @ts-ignore
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA] = new PredictGameExperience();
      // @ts-ignore
      Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1] = new PredictGameExperienceWithNeuralNetwork(
        neuralModel
      );
    }

    // @ts-ignore
    return Measurement.PREDICTED_GAME_EXPERIENCE_ALGORITHMS.reduce((result, algorithm) => {
      // @ts-ignore
      result[algorithm] = Measurement.predictGameExperience[region][algorithm].predict(rtt, packetLostPercent);
      return result;
    }, {});
  }

  /**
   * Process mouse data channel report to fetch mouseMessagesSentPerSecond
   * @param report
   */
  processDataChannelMouseReport(report: any) {
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
  processDataChannelTouchReport(report: any) {
    //Extract data-channel:touch logs
    if (report.type === Measurement.REPORT_TYPE_DATA_CHANNEL && report.label === Measurement.REPORT_LABEL_TOUCH) {
      this.measurement.touchMessagesSentPerSecond =
        (report.messagesSent - this.previousMeasurement.messagesSentTouch) / this.measurement.measureDuration;
      this.previousMeasurement.messagesSentTouch = report.messagesSent;
    }
  }

  /**
   * Convert frame timestamps into a shorter (and more useful) form
   * @param {{
   *   encodedTimestamp: number,
   *   shownTimestamp: number
   * }[]} frameTimestamps The timestamps for each frame since the last measurement
   */
  processFrameTimestamps(frameTimestamps: number[]) {
    this.measurement.firstShownFrameUnixTimestampMs = frameTimestamps[0];
    this.measurement.shownFrameDeltasMs = frameTimestamps.map((shownTimestamp, i) => {
      if (i === 0) {
        return this.previousMeasurement.lastFrameShownTimestamp !== null
          ? shownTimestamp - this.previousMeasurement.lastFrameShownTimestamp!
          : 0; // Set the interframe delay for the very first frame to 0, just to have a number
      }

      return shownTimestamp - frameTimestamps[i - 1];
    });
    this.previousMeasurement.lastFrameShownTimestamp = frameTimestamps[frameTimestamps.length - 1];
  }
}
