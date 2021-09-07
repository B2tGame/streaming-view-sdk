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
   * @param canvas Reference to HTML CanvasTouch element
   */
  constructor(edgeNodeId, video, canvas, canvasTouch) {
    this.edgeNodeId = edgeNodeId;
    this.video = video;
    this.canvas = canvas;
    this.canvasTouch = canvasTouch;
  }

  /**
   * Capture the stream <video> element and check if the there is a circle at x y.
   * @param {int} x coordinate of first click
   * @param {int} y coordinate of first click
   * @returns {boolean}
   */
   captureTouch = (x, y) => {
    if (this.canvasTouch.current && this.video.current) {
      const canvasWidth = this.canvasTouch.current.width;

      const ctx = this.canvasTouch.current.getContext('2d');

      ctx.drawImage(this.video.current, x + 1 - canvasWidth / 2, y + 1 - canvasWidth / 2, canvasWidth, canvasWidth, 0, 0, canvasWidth, canvasWidth);

      var frame = ctx.getImageData(0, 0, canvasWidth, canvasWidth);
      var length = frame.data.length;
  
      for (let i = 0; i < length; i += 4) {
        const red = frame.data[i + 0];
        const green = frame.data[i + 1];
        const blue = frame.data[i + 2];

        frame.data[i] = (red + green + blue) / 3;
        frame.data[i+1] = (red + green + blue) / 3;
        frame.data[i+2] = (red + green + blue) / 3;
      }
      ctx.putImageData(frame, 0, 0);


      const rawImage = ctx.getImageData(0, 0, canvasWidth, canvasWidth);
      this.pixelData = ctx.getImageData(0,0,canvasWidth, canvasWidth);

      ctx.clearRect(0, 0, canvasWidth, canvasWidth);

      this.ctxDimensions = {};
      this.ctxDimensions.width = canvasWidth;
      this.ctxDimensions.height = canvasWidth;

      this.edgeDetection(ctx, canvasWidth, canvasWidth);

      frame = ctx.getImageData(0, 0, canvasWidth, canvasWidth);
      length = frame.data.length;
  
      const radius = 11;
      var hits = 0;
      const points = new Set()

      for (let angle = 0; angle < 360; angle+=6) {
        var xa = Math.round(radius * Math.sin(Math.PI * 2 * angle / 360) + canvasWidth / 2);
        var ya = Math.round(radius * Math.cos(Math.PI * 2 * angle / 360) + canvasWidth / 2);

        if (!points.has(xa + ya * canvasWidth)) {
          const value = frame.data[(xa + ya * canvasWidth) * 4];
          if (value !== undefined && value > 0) {
            hits += 1;
          }
          
          points.add(xa + ya * canvasWidth);
        }
      }

      return hits / points.size > 0.5;
    }
   }

   edgeDetection = function(ctx, canvasWidth) {
    this.threshold = 30;

     for (let y = 0; y < this.pixelData.height; y++) {
       for (let x = 0; x < this.pixelData.width; x++) {
         const index = (x + y * canvasWidth) * 4;
         const pixel = this.pixelData.data[index + 2];

         const left = this.pixelData.data[index - 4];
         const right = this.pixelData.data[index + 4];
         const top = this.pixelData.data[index - (canvasWidth * 4)];
         const bottom = this.pixelData.data[index + (canvasWidth * 4)];

         if (pixel > left + this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel < left - this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel > right + this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel < right - this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel > top + this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel < top - this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel > bottom + this.threshold) {
           this.plotPoint(ctx, x, y);
         } else if (pixel < bottom - this.threshold) {
           this.plotPoint(ctx, x, y);
         }
       }
     }
  }
  
  plotPoint = function(ctx, x,y){
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.beginPath();
  };

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

      const pixels = [];

      // Offset is used to avoid corners of the stream video to lower number of faulty video pixels
      for (let y = offset; y < scaledHeight - offset; y = y + StreamCaptureService.SCREEN_PIXEL_RATIO) {
        for (let x = offset; x < scaledWidth - offset; x = x + StreamCaptureService.SCREEN_PIXEL_RATIO) {
          // rawImage including RGBA color values, where A is alpha channel, which specifies the opacity for a color
          pixels.push(this.getPixel(rawImage, (y * (scaledWidth - offset) + x) * 4));
        }
      }

      // Find and get the color of the middle pixel of the screen (center).
      const centerPixelOffset = ((scaledHeight * scaledWidth / 2) + (scaledWidth / 2)) * 4;
      const centerPixelColor = this.rgbToHex(this.getPixel(rawImage, centerPixelOffset));

      const averagePixelColor = this.avgColor(pixels);
      const hasVideo = !pixels.every((pixel) => this.isDarkGrey(pixel) && this.isSameColor(averagePixelColor, pixel));

      StreamingEvent.edgeNode(this.edgeNodeId).emit(StreamingEvent.STREAM_VIDEO_SCREENSHOT, {
        hasVideo: hasVideo,
        captureProcessingTime: Date.now() - captureVideoStreamStartTime,
        screenshot: this.canvas.current.toDataURL('image/jpeg'),
        centerPixelColor: centerPixelColor
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
