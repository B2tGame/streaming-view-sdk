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
   * Ratio used for defining how many pixels should be analysed from the screenshot. Ratio 3 will
   * use every 3th pixel from axis x and y means that ~11% of image pixel will be analysed.
   * Image 36x64 = 2304 pixels, with ratio 3 (36/3)x(64/3) = 256 pixels to be analysed
   * @return {number}
   */
  static get SCREEN_PIXEL_RATIO() {
    return 3;
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
    const scaledWidth = emulatorWidth / StreamCaptureService.CANVAS_SCALE_FACTOR;
    const scaledHeight = emulatorHeight / StreamCaptureService.CANVAS_SCALE_FACTOR;
    const offset = StreamCaptureService.SCREEN_DETECTOR_OFFSET;

    if (this.canvas.current && this.video.current) {
      const ctx = this.canvas.current.getContext('2d');
      ctx.drawImage(this.video.current, 0, 0, scaledWidth, scaledHeight);
      const rawImage = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

      let pixels = [];

      // Offset is used to avoid corners of the stream video to lower number of faulty video pixels
      for (let y = offset; y < scaledHeight - offset; y = y + StreamCaptureService.SCREEN_PIXEL_RATIO) {
        for (let x = offset; x < scaledWidth - offset; x = x + StreamCaptureService.SCREEN_PIXEL_RATIO) {
          // rawImage including RGBA color values, where A is alpha channel, which specifies the opacity for a color
          pixels.push(this.getPixel(rawImage, (y * (scaledWidth - offset) + x) * 4));
        }
      }

      const averagePixelColor = this.avgColor(pixels);
      const hasVideo = !pixels.every((pixel) => this.isDarkGrey(pixel) && this.isSameColor(averagePixelColor, pixel));

      StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {
        hasVideo: hasVideo,
        captureProcessingTime: Date.now() - captureVideoStreamStartTime,
        screenshot: this.canvas.current.toDataURL('image/jpeg')
      });
    }
  };

  /**
   * Check if color of pixel is "same", there is a tolerance of 15 - from RGB color model
   * @param {{red: number, green: number, blue: number}} pixel1
   * @param {{red: number, green: number, blue: number}} pixel2
   * @return {boolean}
   */
  isSameColor(pixel1, pixel2) {
    return Math.abs(pixel1.red - pixel2.red) < 15 && Math.abs(pixel1.green - pixel2.green) < 15 && Math.abs(pixel1.blue - pixel2.blue) < 15;
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
