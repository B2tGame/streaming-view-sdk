import StreamingEvent from '../StreamingEvent';

export default class StreamCaptureService {
  /**
   * How many times smaller should the thumbnail screenshot in comparison with the source stream.
   * @returns {number}
   * @constructor
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
   * @param {string} edgeNodeId
   * @param video Reference to HTML Video element
   * @param canvas Reference to HTML Canvas element
   */
  constructor(edgeNodeId, video, canvas) {
    this.edgeNodeId = edgeNodeId;
    this.video = video;
    this.canvas = canvas;
  }

  /**
   * Capture the stream <video> element and check if the video stream is a black or grey.
   * @param {int} emulatorWidth Emulator width in pixels
   * @param {int} emulatorHeight Emulator height in pixes
   * @returns {string}
   */
  captureScreenshot = (emulatorWidth, emulatorHeight) => {
    const captureVideoStreamStartTime = Date.now();

    if (this.canvas.current && this.video.current) {
      const ctx = this.canvas.current.getContext('2d');
      ctx.drawImage(
        this.video.current,
        0,
        0,
        emulatorWidth / StreamCaptureService.CANVAS_SCALE_FACTOR,
        emulatorHeight / StreamCaptureService.CANVAS_SCALE_FACTOR
      );
      const rawImage = ctx.getImageData(
        0,
        0,
        emulatorWidth / StreamCaptureService.CANVAS_SCALE_FACTOR,
        emulatorHeight / StreamCaptureService.CANVAS_SCALE_FACTOR
      );
      const offset = StreamCaptureService.SCREEN_DETECTOR_OFFSET;
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
      StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {
        hasVideo: hasVideo,
        borderColor: this.rgbToHex(this.avgColor(borderPixels)),
        captureProcessingTime: Date.now() - captureVideoStreamStartTime,
        screenshot: !hasVideo ? this.canvas.current.toDataURL('image/jpeg') : undefined
      });
    }
  };

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

  /**
   *
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

  rgbToHex(pixel) {
    return '#' + ((1 << 24) + (pixel.red << 16) + (pixel.green << 8) + pixel.blue).toString(16).slice(1);
  }
}
