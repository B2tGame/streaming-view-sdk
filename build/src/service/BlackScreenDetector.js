"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

/**
 * Black Screen Detector in regular intervals analysing SDK behaviour with help of video stream screenshots
 * and reporting detected black screen issues with possible causes to the backend service
 */
var BlackScreenDetector = /*#__PURE__*/function () {
  /**
   *
   * @param {string} edgeNodeId
   * @param {string} streamingViewId
   */
  function BlackScreenDetector(edgeNodeId, streamingViewId) {
    var _this = this;

    (0, _classCallCheck2.default)(this, BlackScreenDetector);

    this.onStreamVideoScreenshot = function (event) {
      if (event.hasVideo) {
        _this.workingStreamLatestTimestamp = Date.now();
      }
    };

    this.onEvent = function (event, payload) {
      var _context;

      if ((0, _includes.default)(_context = BlackScreenDetector.EVENTS_TO_IGNORE).call(_context, event) === false) {
        if (_this.recentEvents.length > BlackScreenDetector.NUMBER_OF_RECENT_EVENTS) {
          _this.recentEvents.shift();
        }

        _this.recentEvents.push({
          event: event,
          payload: payload
        });
      }
    };

    this.edgeNodeId = edgeNodeId;
    this.streamingViewId = streamingViewId;
    this.workingStreamLatestTimestamp = Date.now(); // Period to "delay report of black screen" when browser is loading video stream after stream is visible

    this.notVisibleHoldOffPeriod = 0;
    this.recentEvents = [];

    _StreamingEvent.default.edgeNode(this.edgeNodeId).on('event', this.onEvent).on(_StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);

    this.monitorInterval = setInterval(function () {
      if (_this.browserTabIsVisible() && _this.streamVisibleOnViewport()) {
        if (_this.workingStreamLatestTimestamp < Date.now() - BlackScreenDetector.THRESHOLD && _this.notVisibleHoldOffPeriod < Date.now()) {
          _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.STREAM_BLACK_SCREEN, {
            cause: (0, _stringify.default)(_this.recentEvents)
          });
        }
      } else {
        _this.notVisibleHoldOffPeriod = Date.now() + BlackScreenDetector.THRESHOLD;
      }
    }, 1000);
  }
  /**
   * @param {{hasVideo: boolean, borderColor: {red: number, green: number, blue: number}, captureProcessingTime: timestamp, screenshot: ImageData|undefined}} event
   */


  (0, _createClass2.default)(BlackScreenDetector, [{
    key: "browserTabIsVisible",
    value:
    /**
     * Check if browser tab is visible for the user by Page Visibility API
     * @return {boolean}
     */
    function browserTabIsVisible() {
      var documentHidden = true;

      if (typeof document.hidden !== 'undefined') {
        // Opera 12.10 and Firefox 18 and later support
        documentHidden = document.hidden;
      } else if (typeof document.msHidden !== 'undefined') {
        documentHidden = document.mHsidden;
      } else if (typeof document.webkitHidden !== 'undefined') {
        documentHidden = document.webkitHidden;
      }

      return !documentHidden;
    }
    /**
     * Detect if Streaming View SDK is visible for the user
     * @return {boolean}
     */

  }, {
    key: "streamVisibleOnViewport",
    value: function streamVisibleOnViewport() {
      var rootElement = document.getElementById(this.streamingViewId);

      if (rootElement) {
        var domRect = rootElement.getBoundingClientRect();
        var topElement = document.elementFromPoint(Math.round(domRect.left + domRect.width / 2), Math.round(domRect.top + domRect.height / 2)); // Verify if top element is part of the Streaming View component

        return topElement ? !!topElement.closest("#".concat(CSS.escape(this.streamingViewId))) : false;
      }

      return false;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
      }

      _StreamingEvent.default.edgeNode(this.edgeNodeId).off('event', this.onEvent).off(_StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);
    }
  }], [{
    key: "THRESHOLD",
    get:
    /**
     * Timeout after which black screen should be reported
     * @returns {number}
     */
    function get() {
      return 1500;
    }
    /**
     * Number of latest events, which should be reported in the BLACK_SCREEN event
     * @return {number}
     */

  }, {
    key: "NUMBER_OF_RECENT_EVENTS",
    get: function get() {
      return 5;
    }
    /**
     * Events, which should be excluded from recent events for black screen reporting
     * @return {string[]}
     */

  }, {
    key: "EVENTS_TO_IGNORE",
    get: function get() {
      return [_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, _StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, _StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, _StreamingEvent.default.WEB_RTC_MEASUREMENT, _StreamingEvent.default.REPORT_MEASUREMENT, _StreamingEvent.default.STREAM_BLACK_SCREEN, _StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, _StreamingEvent.default.MOMENT_DETECTOR_EVENT];
    }
  }]);
  return BlackScreenDetector;
}();

exports.default = BlackScreenDetector;