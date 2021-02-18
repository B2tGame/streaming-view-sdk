import StreamingEvent from '../StreamingEvent';

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
      StreamingEvent.REQUEST_WEB_RTC_MEASUREMENT,
      StreamingEvent.WEB_RTC_MEASUREMENT,
      StreamingEvent.REPORT_MEASUREMENT,
      StreamingEvent.STREAM_BLACK_SCREEN,
      StreamingEvent.STREAM_VIDEO_SCREENSHOT
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
    this.latestNotVisibleStreamTimestamp = Date.now();
    this.recentEvents = [];

    StreamingEvent.edgeNode(this.edgeNodeId)
      .on('event', this.onEvent)
      .on(StreamingEvent.STREAM_VIDEO_SCREENSHOT, this.onStreamVideoScreenshot);

    this.monitorInterval = setInterval(() => {
      if (
        this.streamIsVisible() &&
        this.workingStreamLatestTimestamp < Date.now() - BlackScreenDetector.THRESHOLD &&
        this.latestNotVisibleStreamTimestamp < Date.now() - BlackScreenDetector.THRESHOLD
      ) {
        StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_BLACK_SCREEN, {
          cause: JSON.stringify(this.recentEvents)
        });
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

  onEvent = (event, payload) => {
    if (BlackScreenDetector.EVENTS_TO_IGNORE.includes(event) === false) {
      if (this.recentEvents.length > BlackScreenDetector.NUMBER_OF_RECENT_EVENTS) {
        this.recentEvents.shift();
      }
      this.recentEvents.push({ event: event, payload: payload });
    }
  };

  /**
   * Check if stream is visible to the user
   * @return {boolean}
   */
  streamIsVisible() {
    if (this.pageIsVisible() && this.streamVisibleOnViewport())  {
      return true;
    } else {
      this.latestNotVisibleStreamTimestamp = Date.now();
      return false;
    }
  }

  /**
   * Check if webpage is visible for the user by Page Visibility API
   * @return {boolean}
   */
  pageIsVisible() {
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
    const domRect = rootElement.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      Math.round(domRect.left + domRect.width / 2),
      Math.round(domRect.top + domRect.height / 2)
    );

    // Verify if top element is part of the Streaming View component
    return !!topElement.closest(`#${CSS.escape(this.streamingViewId)}`);
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
