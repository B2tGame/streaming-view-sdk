"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

/**
 * Black Screen Detector in regular intervals analysing SDK behaviour with help of video stream screenshots
 * and reporting detected black screen issues with possible causes to the backend service
 */
class BlackScreenDetector {
  /**
   * Timeout after which black screen should be reported
   * @returns {number}
   */
  static get THRESHOLD() {
    return 1500;
  }
  /**
   * Number of latest events, which should be reported in the BLACK_SCREEN event
   * @return {number}
   */


  static get NUMBER_OF_RECENT_EVENTS() {
    return 5;
  }
  /**
   * Events, which should be excluded from recent events for black screen reporting
   * @return {string[]}
   */


  static get EVENTS_TO_IGNORE() {
    return [_StreamingEvent.default.ROUND_TRIP_TIME_MEASUREMENT, _StreamingEvent.default.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT, _StreamingEvent.default.REQUEST_WEB_RTC_MEASUREMENT, _StreamingEvent.default.WEB_RTC_MEASUREMENT, _StreamingEvent.default.REPORT_MEASUREMENT, _StreamingEvent.default.STREAM_BLACK_SCREEN, _StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, _StreamingEvent.default.MOMENT_DETECTOR_EVENT];
  }
  /**
   *
   * @param {string} edgeNodeId
   * @param {string} streamingViewId
   */


  constructor(edgeNodeId, streamingViewId) {
    this.onStreamVideoScreenshot = event => {
      if (event.hasVideo) {
        this.workingStreamLatestTimestamp = Date.now();
      }
    };

    this.onEvent = (event, payload) => {
      if (BlackScreenDetector.EVENTS_TO_IGNORE.includes(event) === false) {
        if (this.recentEvents.length > BlackScreenDetector.NUMBER_OF_RECENT_EVENTS) {
          this.recentEvents.shift();
        }

        this.recentEvents.push({
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

    this.monitorInterval = setInterval(() => {
      if (this.browserTabIsVisible() && this.streamVisibleOnViewport()) {
        if (this.workingStreamLatestTimestamp < Date.now() - BlackScreenDetector.THRESHOLD && this.notVisibleHoldOffPeriod < Date.now()) {
          _StreamingEvent.default.edgeNode(this.edgeNodeId).emit(_StreamingEvent.default.STREAM_BLACK_SCREEN, {
            cause: JSON.stringify(this.recentEvents)
          });
        }
      } else {
        this.notVisibleHoldOffPeriod = Date.now() + BlackScreenDetector.THRESHOLD;
      }
    }, 1000);
  }
  /**
   * @param {{hasVideo: boolean, borderColor: {red: number, green: number, blue: number}, captureProcessingTime: timestamp, screenshot: ImageData|undefined}} event
   */


  /**
   * Check if browser tab is visible for the user by Page Visibility API
   * @return {boolean}
   */
  browserTabIsVisible() {
    let documentHidden = true;

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


  streamVisibleOnViewport() {
    const rootElement = document.getElementById(this.streamingViewId);

    if (rootElement) {
      const domRect = rootElement.getBoundingClientRect();
      const topElement = document.elementFromPoint(Math.round(domRect.left + domRect.width / 2), Math.round(domRect.top + domRect.height / 2)); // Verify if top element is part of the Streaming View component

      return topElement ? !!topElement.closest("#".concat(CSS.escape(this.streamingViewId))) : false;
    }

    return false;
  }

  destroy() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    _StreamingEvent.default.edgeNode(this.edgeNodeId).off('event', this.onEvent).off(_StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);
  }

}

exports.default = BlackScreenDetector;