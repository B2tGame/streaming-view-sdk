"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var _PredictGameExperience = _interopRequireDefault(require("../../measurements/service/PredictGameExperience"));

var _PredictGameExperienceWithNeuralNetwork = _interopRequireDefault(require("./PredictGameExperienceWithNeuralNetwork"));

var _StreamWebRtc = _interopRequireDefault(require("./StreamWebRtc"));

var _StreamSocket = _interopRequireDefault(require("./StreamSocket"));

var _Classification = _interopRequireDefault(require("./Classification"));

/**
 * Measurement class is responsible for processing and reporting measurement reports
 */
var Measurement = /*#__PURE__*/function () {
  /**
   *
   * @param {string} edgeNodeId
   * @param {Logger} logger
   */
  function Measurement(edgeNodeId, streamingViewId, logger) {
    var _this = this;

    (0, _classCallCheck2.default)(this, Measurement);

    this.onStreamQualityRating = function (rating) {
      _this.streamQualityRating = rating.streamQualityRating;
    };

    this.onStreamBlackScreen = function () {
      _this.numberOfBlackScreens += 1;
    };

    this.onRoundTripTimeMeasurement = function (networkRoundTripTime) {
      _this.networkRoundTripTime = networkRoundTripTime;
    };

    this.onWebRtcRoundTripTimeMeasurement = function (webrtcRoundTripTime) {
      _this.webrtcRoundTripTimeValues.push(webrtcRoundTripTime);
    };

    this.onWebRtcMeasurement = function (stats) {
      _this.reportWebRtcMeasurement(stats);
    };

    this.onStreamDisconnected = function () {
      _this.previousMeasurement = _this.defaultPreviousMeasurement();
    };

    this.onStreamTerminated = function () {
      _this.createClassificationReport('stream-terminated');
    };

    this.onStreamResumed = function () {
      _this.startClassificationRecording();

      _this.didStreamResume = true;
    };

    this.onStreamPaused = function () {
      // Here we could probably stop recording measurements?
      if (_this.didStreamResume) {
        _this.createClassificationReport('stream-paused');
      }
    };

    this.onEmulatorConfiguration = function (payload) {
      if (payload.state === 'resumed') {
        _this.startClassificationRecording();

        _this.didStreamResume = true;
      }
    };

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
    this.classification = new _Classification.default(streamingViewId, logger);
    this.isClassificationReportCreated = false;

    _StreamingEvent.default.edgeNode(edgeNodeId).on(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement).on(_StreamingEvent.default.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement).on(_StreamingEvent.default.STREAM_QUALITY_RATING, this.onStreamQualityRating).on(_StreamingEvent.default.STREAM_BLACK_SCREEN, this.onStreamBlackScreen).on(_StreamingEvent.default.STREAM_DISCONNECTED, this.onStreamDisconnected).on(_StreamingEvent.default.STREAM_TERMINATED, this.onStreamTerminated).on(_StreamingEvent.default.STREAM_RESUMED, this.onStreamResumed).on(_StreamingEvent.default.STREAM_PAUSED, this.onStreamPaused).on(_StreamingEvent.default.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration);
  }
  /**
   * @param {string} webRtcHost
   * @param {number} pingInterval
   * @param {{ name: string, candidates: [{*}] }} iceServers
   */


  (0, _createClass2.default)(Measurement, [{
    key: "initWebRtc",
    value: function initWebRtc(webRtcHost, pingInterval) {
      var _this2 = this;

      var iceServers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
        name: 'default',
        candidates: []
      };
      this.webRtcHost = webRtcHost;
      this.streamWebRtc = new _StreamWebRtc.default(this.webRtcHost, iceServers, pingInterval);
      this.streamWebRtc.on(_StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, this.onWebRtcRoundTripTimeMeasurement);

      _StreamingEvent.default.edgeNode(this.edgeNodeId).on(_StreamingEvent.default.STREAM_UNREACHABLE, this.streamWebRtc.close);

      this.webRtcIntervalHandler = setInterval(function () {
        _StreamingEvent.default.edgeNode(_this2.edgeNodeId).emit(_StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT);
      }, _StreamSocket.default.WEBSOCKET_PING_INTERVAL);
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "destroy",
    value: function destroy() {
      this.logger.info('measurement module is destroyed');

      _StreamingEvent.default.edgeNode(this.edgeNodeId).off(_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, this.onRoundTripTimeMeasurement).off(_StreamingEvent.default.WEB_RTC_MEASUREMENT, this.onWebRtcMeasurement).off(_StreamingEvent.default.STREAM_QUALITY_RATING, this.onStreamQualityRating).off(_StreamingEvent.default.STREAM_BLACK_SCREEN, this.onStreamBlackScreen).off(_StreamingEvent.default.STREAM_DISCONNECTED, this.onStreamDisconnected).off(_StreamingEvent.default.STREAM_RESUMED, this.onStreamResumed).off(_StreamingEvent.default.EMULATOR_CONFIGURATION, this.onEmulatorConfiguration).off(_StreamingEvent.default.STREAM_TERMINATED, this.onStreamTerminated);

      this.createClassificationReport('destructor-called');

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
  }, {
    key: "createClassificationReport",
    value: function createClassificationReport(reportTrigger) {
      _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.CLASSIFICATION_REPORT, this.classification.createClassificationReport(reportTrigger));
    }
  }, {
    key: "startClassificationRecording",
    value: function startClassificationRecording() {
      var _this3 = this;

      if (!this.didStreamResume) {
        this.classification.startMeasurement();
        this.classification.registerMetricEventListener(function (evt) {
          _this3.createClassificationReport(evt.type);
        });
      }
    }
    /**
     * Return default values for previous measurement
     * @return {{ messagesSentMouse: number, bytesReceived: number, framesReceived: number, messagesSentTouch: number, measureAt: number, totalDecodeTime: number, totalInterFrameDelay: number, totalSquaredInterFrameDelay: number, framesDecoded: number, framesDropped: null, jitter: null}}
     */

  }, {
    key: "defaultPreviousMeasurement",
    value: function defaultPreviousMeasurement() {
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

  }, {
    key: "reportWebRtcMeasurement",
    value: function reportWebRtcMeasurement(stats) {
      var _this4 = this;

      this.measurement.measureAt = Date.now();
      this.measurement.measureDuration = (this.measurement.measureAt - this.previousMeasurement.measureAt) / 1000; // Process all reports and collect measurement data

      stats.forEach(function (report) {
        _this4.processInboundRtpVideoReport(report);

        _this4.processTrackVideoReport(report);

        _this4.processDataChannelMouseReport(report);

        _this4.processDataChannelTouchReport(report);

        _this4.processCandidatePairReport(report);
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

  }, {
    key: "processInboundRtpVideoReport",
    value: function processInboundRtpVideoReport(report) {
      if (report.type === Measurement.REPORT_TYPE_INBOUND_RTP && report.kind === Measurement.REPORT_KIND_VIDEO) {
        this.measurement.framesDecodedPerSecond = (report.framesDecoded - this.previousMeasurement.framesDecoded) / this.measurement.measureDuration;
        this.measurement.bytesReceivedPerSecond = (report.bytesReceived - this.previousMeasurement.bytesReceived) / this.measurement.measureDuration;
        this.measurement.videoProcessing = report.framesDecoded - this.previousMeasurement.framesDecoded !== 0 ? ((report.totalDecodeTime || 0) - this.previousMeasurement.totalDecodeTime) * 1000 / this.measurement.framesDecodedPerSecond : 0;
        this.measurement.totalDecodeTimePerSecond = Measurement.roundToDecimals((report.totalDecodeTime - this.previousMeasurement.totalDecodeTime) / this.measurement.measureDuration);
        this.measurement.totalInterFrameDelayPerSecond = Measurement.roundToDecimals((report.totalInterFrameDelay - this.previousMeasurement.totalInterFrameDelay) / this.measurement.measureDuration);
        var currentPacketsLost = report.packetsLost - this.previousMeasurement.packetsLost;
        var currentPacketsReceived = report.packetsReceived - this.previousMeasurement.packetsReceived;
        var expectedPacketsReceived = currentPacketsLost + currentPacketsReceived;
        this.measurement.packetsLostPercent = currentPacketsLost * 100 / (expectedPacketsReceived || 1);
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
        this.classification.injectMeasurement(this.measurement.framesDecodedPerSecond, this.measurement.interFrameDelayStandardDeviationInMs);
      }
    }
    /**
     * Calculates standard deviation value for the given input
     * @param {{}} currentStats
     * @param {{}} previousStats
     * @return {number|undefined} Standard deviation value
     */

  }, {
    key: "processWebRtcRoundTripTimeStats",
    value: function processWebRtcRoundTripTimeStats() {
      this.webrtcRoundTripTime = _StreamWebRtc.default.calculateRoundTripTimeStats(this.webrtcRoundTripTimeValues).rtt;
      this.webrtcRoundTripTimeValues = [];
      this.measurement.predictedGameExperience = Measurement.calculatePredictedGameExperience(this.networkRoundTripTime, this.measurement.packetsLostPercent);
      this.measurement.webrtcRoundTripTime = this.webrtcRoundTripTime;
    }
    /**
     * Process candidate-pair report to fetch currentRoundTripTime
     * @param report
     */

  }, {
    key: "processCandidatePairReport",
    value: function processCandidatePairReport(report) {
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

  }, {
    key: "processTrackVideoReport",
    value:
    /**
     * Process track video report to fetch framesReceivedPerSecond and framesDropped
     * @param report
     */
    function processTrackVideoReport(report) {
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

  }, {
    key: "processDataChannelMouseReport",
    value: function processDataChannelMouseReport(report) {
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

  }, {
    key: "processDataChannelTouchReport",
    value: function processDataChannelTouchReport(report) {
      //Extract data-channel:touch logs
      if (report.type === Measurement.REPORT_TYPE_DATA_CHANNEL && report.label === Measurement.REPORT_LABEL_TOUCH) {
        this.measurement.touchMessagesSentPerSecond = (report.messagesSent - this.previousMeasurement.messagesSentTouch) / this.measurement.measureDuration;
        this.previousMeasurement.messagesSentTouch = report.messagesSent;
      }
    }
  }], [{
    key: "REPORT_TYPE_INBOUND_RTP",
    get: function get() {
      return 'inbound-rtp';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_TYPE_TRACK",
    get: function get() {
      return 'track';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_TYPE_DATA_CHANNEL",
    get: function get() {
      return 'data-channel';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_TYPE_CANDIDATE_PAIR",
    get: function get() {
      return 'candidate-pair';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_KIND_VIDEO",
    get: function get() {
      return 'video';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_LABEL_MOUSE",
    get: function get() {
      return 'mouse';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "REPORT_LABEL_TOUCH",
    get: function get() {
      return 'touch';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "PREDICTED_GAME_EXPERIENCE_ALPHA",
    get: function get() {
      return 'alpha';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "PREDICTED_GAME_EXPERIENCE_NEURAL1",
    get: function get() {
      return 'neural1';
    }
    /**
     *
     * @return {string}
     */

  }, {
    key: "PREDICTED_GAME_EXPERIENCE_DEFAULT",
    get: function get() {
      return Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA;
    }
    /**
     *
     * @return {string[]}
     */

  }, {
    key: "PREDICTED_GAME_EXPERIENCE_ALGORITHMS",
    get: function get() {
      return [Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA, Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1];
    }
  }, {
    key: "calculatePredictedGameExperience",
    value: function calculatePredictedGameExperience(rtt, packetLostPercent) {
      var _context;

      var region = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'default';

      if (Measurement.predictGameExperience === undefined) {
        Measurement.predictGameExperience = {};
      }

      if (Measurement.predictGameExperience[region] === undefined) {
        Measurement.predictGameExperience[region] = {};
        Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_ALPHA] = new _PredictGameExperience.default();
        Measurement.predictGameExperience[region][Measurement.PREDICTED_GAME_EXPERIENCE_NEURAL1] = new _PredictGameExperienceWithNeuralNetwork.default(require('./neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49'));
      }

      return (0, _reduce.default)(_context = Measurement.PREDICTED_GAME_EXPERIENCE_ALGORITHMS).call(_context, function (result, algorithm) {
        result[algorithm] = Measurement.predictGameExperience[region][algorithm].predict(rtt, packetLostPercent);
        return result;
      }, {});
    }
  }]);
  return Measurement;
}();

exports.default = Measurement;

Measurement.calculateStandardDeviation = function (currentStats, previousStats) {
  var deltaCount = currentStats.framesDecoded - previousStats.framesDecoded;

  if (deltaCount <= 0) {
    return undefined;
  }

  var deltaSquaredSum = currentStats.totalSquaredInterFrameDelay - previousStats.totalSquaredInterFrameDelay;
  var deltaSum = currentStats.totalInterFrameDelay - previousStats.totalInterFrameDelay;
  var variance = (deltaSquaredSum - Math.pow(deltaSum, 2) / deltaCount) / deltaCount;
  return Math.sqrt(Math.abs(variance)) * 1000;
};

Measurement.roundToDecimals = function (value) {
  var decimals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;

  if (value !== undefined) {
    var multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  } else {
    return undefined;
  }
};