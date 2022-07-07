import StreamingEvent from '../StreamingEvent';

/**
 * Black Screen Detector in regular intervals analysing SDK behaviour with help of video stream screenshots
 * and reporting detected black screen issues with possible causes to the backend service
 */
export default class BlackScreenDetector {
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
    return [
      StreamingEvent.ROUND_TRIP_TIME_MEASUREMENT,
      StreamingEvent.WEBRTC_ROUND_TRIP_TIME_MEASUREMENT,
      StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT,
      StreamingEvent.WEB_RTC_MEASUREMENT,
      StreamingEvent.REPORT_MEASUREMENT,
      StreamingEvent.STREAM_BLACK_SCREEN,
      StreamingEvent.STREAM_VIDEO_SCREENSHOT,
      StreamingEvent.MOMENT_DETECTOR_EVENT,
    ];
  }

  /**
   *
   * @param {string} edgeNodeId
   * @param {string} streamingViewId
   */
  constructor(edgeNodeId, streamingViewId) {
    this.edgeNodeId = edgeNodeId;
    this.streamingViewId = streamingViewId;
    this.workingStreamLatestTimestamp = Date.now();
    // Period to "delay report of black screen" when browser is loading video stream after stream is visible
    this.notVisibleHoldOffPeriod = 0;
    this.recentEvents = [];

    StreamingEvent.edgeNode(this.edgeNodeId)
      .on('event', this.onEvent)
      .on(StreamingEvent.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);

    this.monitorInterval = setInterval(() => {
      if (this.browserTabIsVisible() && this.streamVisibleOnViewport()) {
        if (this.workingStreamLatestTimestamp < Date.now() - BlackScreenDetector.THRESHOLD && this.notVisibleHoldOffPeriod < Date.now()) {
          StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_BLACK_SCREEN, {
            cause: JSON.stringify(this.recentEvents),
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
  onStreamVideoScreenshot = (event) => {
    if (event.hasVideo) {
      this.workingStreamLatestTimestamp = Date.now();
    }
  };

  /**
   * On event method is used for keeping track of possible causes of the black screens by storing recent events
   * @param {string} event
   * @param {{}|undefined} payload
   */
  onEvent = (event, payload) => {
    if (BlackScreenDetector.EVENTS_TO_IGNORE.includes(event) === false) {
      if (this.recentEvents.length > BlackScreenDetector.NUMBER_OF_RECENT_EVENTS) {
        this.recentEvents.shift();
      }
      this.recentEvents.push({ event: event, payload: payload });
    }
  };

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
      const topElement = document.elementFromPoint(
        Math.round(domRect.left + domRect.width / 2),
        Math.round(domRect.top + domRect.height / 2)
      );

      // Verify if top element is part of the Streaming View component
      return topElement ? !!topElement.closest(`#${CSS.escape(this.streamingViewId)}`) : false;
    }

    return false;
  }

  destroy() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    StreamingEvent.edgeNode(this.edgeNodeId)
      .off('event', this.onEvent)
      .off(StreamingEvent.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);
  }
}
