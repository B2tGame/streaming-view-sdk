import StreamingEvent from '../StreamingEvent';

export default class BlackScreenDetector {

  /**
   * How many times smaller should the thumbnail screenshot in comparison with the source stream.
   * @returns {number}
   */
  static get CANVAS_SCALE_FACTOR() {
    return 12;
  }

  /**
   * How many pixels of the stream border should be used for calculation if the screen is black/gray.
   * The real pixel position is SCREEN_DETECTOR_OFFSET*CANVAS_SCALE_FACTOR of the origin size video stream.
   * @returns {number}
   */
  static get SCREEN_DETECTOR_OFFSET() {
    return 2;
  }

  /**
   * Number of recent events for black screen reporting
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
      StreamingEvent.REPORT_MEASUREMENT
    ];
  }

  /**
   *
   * @param {string} edgeNodeId
   * @param video Reference to HTML Video element
   * @param canvas Reference to HTML Canvas element
   * @param {int} emulatorWidth Emulator width in pixels
   * @param {int} emulatorHeight Emulator height in pixes
   */
  constructor(edgeNodeId, video, canvas, emulatorWidth, emulatorHeight) {
    this.edgeNodeId = edgeNodeId;
    this.video = video;
    this.canvas = canvas;
    this.emulatorWidth = emulatorWidth;
    this.emulatorHeight = emulatorHeight;
    // TODO: To be discussed, probably better to use like report after 2 blackscreen?
    this.workingStreamLatestTimestamp = undefined;
    this.recentEvents = [];
  }

  /**
   * Start black screen monitoring when page and video are visble
   */
  startMonitoring() {
    StreamingEvent.edgeNode(this.edgeNodeId).on('event', this.onEvent);

    this.workingStreamLatestTimestamp = Date.now();
    this.monitorInterval = setInterval(() => {
      if (this.pageIsVisible() && this.videoVisibleOnViewport()) {
        this.captureVideoStream();
      } else {
        this.workingStreamLatestTimestamp = undefined;
      }
    }, 1000);
  }

  onEvent = (event, payload) => {
    if (BlackScreenDetector.EVENTS_TO_IGNORE.includes(event) === false) {
      if (this.recentEvents.length > BlackScreenDetector.NUMBER_OF_RECENT_EVENTS) {
        this.recentEvents.shift();
      }
      this.recentEvents.push({ event: event, payload: payload });
    }
  };

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
  videoVisibleOnViewport() {
    const middleElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const visibleOnViewport = !!middleElement.closest('.streamingViewSdk');

    return visibleOnViewport;
  }

  /**
   * Test if a color is dark grey (including total black)
   * @param {{red: number, green: number, blue: number}} pixel
   * @returns {boolean}
   */
  isDarkGrey(pixel) {
    return (
      pixel.red < 50 &&
      pixel.green < 50 &&
      pixel.blue < 50 &&
      Math.abs(pixel.red - pixel.green) < 25 &&
      Math.abs(pixel.green - pixel.blue) < 25 &&
      Math.abs(pixel.blue - pixel.red) < 25
    );
  }

  /**
   * @param {ImageData} image
   * @param {number} offset
   * @returns {{red: number, green: number, blue: number}}
   */
  getPixel(image, offset) {
    return {
      red: image.data[offset],
      green: image.data[offset + 1],
      blue: image.data[offset + 2]
    };
  }

  /**
   * @param {{red: number, green: number, blue: number}[]} pixels
   * @returns {{red: number, green: number, blue: number}}
   */
  avgColor(pixels) {
    return {
      red: Math.round(pixels.reduce((sum, pixel) => sum + pixel.red, 0) / pixels.length),
      green: Math.round(pixels.reduce((sum, pixel) => sum + pixel.green, 0) / pixels.length),
      blue: Math.round(pixels.reduce((sum, pixel) => sum + pixel.blue, 0) / pixels.length)
    };
  }

  rgbToHex(pixel) {
    return '#' + ((1 << 24) + (pixel.red << 16) + (pixel.green << 8) + pixel.blue).toString(16).slice(1);
  }

  /**
   * Capture the stream <video> element and check if the video stream is a black or grey.
   * @returns {string}
   */
  captureVideoStream() {
    const captureVideoStreamStartTime = Date.now();

    if (this.canvas.current && this.video.current) {
      const ctx = this.canvas.current.getContext('2d');
      ctx.drawImage(
        this.video.current,
        0,
        0,
        this.emulatorWidth / BlackScreenDetector.CANVAS_SCALE_FACTOR,
        this.emulatorHeight / BlackScreenDetector.CANVAS_SCALE_FACTOR
      );
      const rawImage = ctx.getImageData(
        0,
        0,
        this.emulatorWidth / BlackScreenDetector.CANVAS_SCALE_FACTOR,
        this.emulatorHeight / BlackScreenDetector.CANVAS_SCALE_FACTOR
      );
      const offset = BlackScreenDetector.SCREEN_DETECTOR_OFFSET;
      const borderPixels = [
        this.getPixel(rawImage, rawImage.width * offset * 4 + offset * 4), // Top Left
        this.getPixel(rawImage, rawImage.width * offset * 4 + (rawImage.width / 2) * 4), // Top Middle
        this.getPixel(rawImage, rawImage.width * offset * 4 + (rawImage.width - offset) * 4), // Top Right
        this.getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + (rawImage.width - offset) * 4), // Middle Right
        this.getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + offset * 4), // Bottom Left
        this.getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + (rawImage.width / 2) * 4), // Bottom Right
        this.getPixel(rawImage, rawImage.width * (rawImage.height - offset) * 4 + (rawImage.width - offset) * 4), // Bottom Right
        this.getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + offset * 4) // Middle Left
      ];
      const centerPixels = [
        this.getPixel(rawImage, rawImage.width * (rawImage.height / 2) * 4 + (rawImage.width / 2) * 4) // Center Center
      ];

      const hasVideo = ![].concat(borderPixels, centerPixels).every((pixel) => this.isDarkGrey(pixel));

      if (hasVideo) {
        this.workingStreamLatestTimestamp = Date.now();
      } else if (this.workingStreamLatestTimestamp < Date.now() - 2000) {
        // Report blackScreen
        StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_BLACK_SCREEN, {
          recentEvents: this.recentEvents,
          captureProcessingTime: Date.now() - captureVideoStreamStartTime,
          screenshot: this.canvas.current.toDataURL('image/jpeg') // or 'image/png' });
        });

        this.recentEvents = [];
      }

      // TODO: let's discuss it @Jesper
      // StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {});
    }
  }

  destroy() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    StreamingEvent.edgeNode(this.edgeNodeId).off('event', this.onEvent);
  }
}
