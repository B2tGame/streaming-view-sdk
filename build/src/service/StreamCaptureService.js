"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _set = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set"));

var _fill = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/fill"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("../StreamingEvent"));

var StreamCaptureService = /*#__PURE__*/function () {
  /**
   * @param {string} edgeNodeId
   * @param video Reference to HTML Video element
   * @param canvas Reference to HTML Canvas element
   * @param canvas Reference to HTML CanvasTouch element
   */
  function StreamCaptureService(edgeNodeId, video, canvas, canvasTouch) {
    var _this = this;

    (0, _classCallCheck2.default)(this, StreamCaptureService);

    this.detectTouch = function (x, y, emulatorWidth, emulatorHeight) {
      var requiredPixelRatio = 0.8;

      if (_this.canvasTouch.current && _this.video.current) {
        var canvasWidth = _this.canvasTouch.current.width;
        var canvasHeight = _this.canvasTouch.current.height;

        var ctx = _this.canvasTouch.current.getContext('2d', {
          alpha: false
        });

        ctx.drawImage(_this.video.current, x + 1 - canvasWidth / 2, y + 1 - canvasHeight / 2, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
        var frame = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        var length = frame.length;

        for (var i = 0; i < length; i += 4) {
          // Greyscale the click areas red channel
          var red = frame[i + 0];
          var green = frame[i + 1];
          var blue = frame[i + 2];
          var indexX = Math.floor(i / 4 % canvasWidth + x + 1 - canvasWidth / 2);
          var indexY = Math.floor(i / 4 / canvasWidth + y + 1 - canvasWidth / 2);

          if (indexX < 0 || emulatorWidth < indexX || indexY < 0 || emulatorHeight < indexY) {
            frame[i] = 0;
          } else {
            frame[i] = (red + green + blue) / 3;
          }
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        _this.edgeDetection(ctx, canvasWidth, frame);

        frame = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        var radius = 10.5;
        var hits = 0;
        var points = new _set.default();

        for (var angle = 0; angle < 360; angle += 6) {
          // Sum up the points on the circle that is marked as having an edge
          var xa = Math.round(radius * Math.sin(Math.PI * 2 * angle / 360) + canvasWidth / 2 - 0.5);
          var ya = Math.round(radius * Math.cos(Math.PI * 2 * angle / 360) + canvasWidth / 2 - 0.5);

          if (!points.has(xa + ya * canvasWidth)) {
            var value = frame[(xa + ya * canvasWidth) * 4];

            if (value !== undefined && value > 0) {
              hits += 1;
            }

            points.add(xa + ya * canvasWidth);
          }
        }

        return hits / points.size > requiredPixelRatio;
      }
    };

    this.edgeDetection = function (ctx, canvasWidth, pixelData) {
      // Defines how aggresivly the edgedetector should classify an edge
      var threshold = 20;

      for (var y = 0; y < pixelData.length / canvasWidth / 4; y++) {
        for (var x = 0; x < canvasWidth; x++) {
          var index = (x + y * canvasWidth) * 4;
          var pixel = pixelData[index];
          var left = pixelData[index - 4];
          var right = pixelData[index + 4];
          var top = pixelData[index - canvasWidth * 4];
          var bottom = pixelData[index + canvasWidth * 4];

          if (pixel > left + threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel < left - threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel > right + threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel < right - threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel > top + threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel < top - threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel > bottom + threshold) {
            this.plotPoint(ctx, x, y);
          } else if (pixel < bottom - threshold) {
            this.plotPoint(ctx, x, y);
          }
        }
      }
    };

    this.plotPoint = function (ctx, x, y) {
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FF0000';
      (0, _fill.default)(ctx).call(ctx);
      ctx.beginPath();
    };

    this.captureScreenshot = function (emulatorWidth, emulatorHeight) {
      var captureVideoStreamStartTime = Date.now();
      var scaledWidth = emulatorWidth / StreamCaptureService.CANVAS_SCALE_FACTOR;
      var scaledHeight = emulatorHeight / StreamCaptureService.CANVAS_SCALE_FACTOR;
      var offset = StreamCaptureService.SCREEN_DETECTOR_OFFSET;

      if (_this.canvas.current && _this.video.current) {
        var ctx = _this.canvas.current.getContext('2d');

        ctx.drawImage(_this.video.current, 0, 0, scaledWidth, scaledHeight);
        var rawImage = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        var pixels = []; // Offset is used to avoid corners of the stream video to lower number of faulty video pixels

        for (var y = offset; y < scaledHeight - offset; y = y + StreamCaptureService.SCREEN_PIXEL_RATIO) {
          for (var x = offset; x < scaledWidth - offset; x = x + StreamCaptureService.SCREEN_PIXEL_RATIO) {
            // rawImage including RGBA color values, where A is alpha channel, which specifies the opacity for a color
            pixels.push(_this.getPixel(rawImage, (y * (scaledWidth - offset) + x) * 4));
          }
        } // Find and get the color of the middle pixel of the screen (center).


        var centerPixelOffset = (scaledHeight * scaledWidth / 2 + scaledWidth / 2) * 4;

        var centerPixelColor = _this.rgbToHex(_this.getPixel(rawImage, centerPixelOffset));

        var averagePixelColor = _this.avgColor(pixels);

        var hasVideo = !pixels.every(function (pixel) {
          return _this.isDarkGrey(pixel) && _this.isSameColor(averagePixelColor, pixel);
        });

        _StreamingEvent.default.edgeNode(_this.edgeNodeId).emit(_StreamingEvent.default.STREAM_VIDEO_SCREENSHOT, {
          hasVideo: hasVideo,
          captureProcessingTime: Date.now() - captureVideoStreamStartTime,
          screenshot: _this.canvas.current.toDataURL('image/jpeg'),
          centerPixelColor: centerPixelColor
        });
      }
    };

    this.edgeNodeId = edgeNodeId;
    this.video = video;
    this.canvas = canvas;
    this.canvasTouch = canvasTouch;
  }
  /**
   * Capture the stream <video> element and check if the there is a circle at x y.
   * 
   * Does this by using edgedetection to redraw only edges in a canvas, 
   * then checks if the radius of the circle has colored pixels or not
   * 
   * @param {int} x coordinate of first click
   * @param {int} y coordinate of first click
   * @returns {boolean}
   */


  (0, _createClass2.default)(StreamCaptureService, [{
    key: "isSameColor",
    value:
    /**
     * Check if color of pixel is "same", there is a tolerance of 15 - from RGB color model
     * @param {{red: number, green: number, blue: number}} pixel1
     * @param {{red: number, green: number, blue: number}} pixel2
     * @return {boolean}
     */
    function isSameColor(pixel1, pixel2) {
      return Math.abs(pixel1.red - pixel2.red) < 15 && Math.abs(pixel1.green - pixel2.green) < 15 && Math.abs(pixel1.blue - pixel2.blue) < 15;
    }
    /**
     * Test if a color is dark grey (including total black)
     * @param {{red: number, green: number, blue: number}} pixel
     * @returns {boolean}
     */

  }, {
    key: "isDarkGrey",
    value: function isDarkGrey(pixel) {
      return pixel.red < 50 && pixel.green < 50 && pixel.blue < 50 && Math.abs(pixel.red - pixel.green) < 25 && Math.abs(pixel.green - pixel.blue) < 25 && Math.abs(pixel.blue - pixel.red) < 25;
    }
    /**
     * @param {{red: number, green: number, blue: number}[]} pixels
     * @returns {{red: number, green: number, blue: number}}
     */

  }, {
    key: "avgColor",
    value: function avgColor(pixels) {
      return {
        red: Math.round((0, _reduce.default)(pixels).call(pixels, function (sum, pixel) {
          return sum + pixel.red;
        }, 0) / pixels.length),
        green: Math.round((0, _reduce.default)(pixels).call(pixels, function (sum, pixel) {
          return sum + pixel.green;
        }, 0) / pixels.length),
        blue: Math.round((0, _reduce.default)(pixels).call(pixels, function (sum, pixel) {
          return sum + pixel.blue;
        }, 0) / pixels.length)
      };
    }
    /**
     *
     * @param {ImageData} image
     * @param {number} offset
     * @returns {{red: number, green: number, blue: number}}
     */

  }, {
    key: "getPixel",
    value: function getPixel(image, offset) {
      return {
        red: image.data[offset],
        green: image.data[offset + 1],
        blue: image.data[offset + 2]
      };
    }
  }, {
    key: "rgbToHex",
    value: function rgbToHex(pixel) {
      var _context;

      return '#' + (0, _slice.default)(_context = ((1 << 24) + (pixel.red << 16) + (pixel.green << 8) + pixel.blue).toString(16)).call(_context, 1);
    }
  }], [{
    key: "CANVAS_SCALE_FACTOR",
    get:
    /**
     * How many times smaller should the thumbnail screenshot in comparison with the source stream.
     * @returns {number}
     * @constructor
     */
    function get() {
      return 12;
    }
    /**
     * How many pixels of the stream border should be used for calculation if the screen is black/gray.
     * The real pixel position is SCREEN_DETECTOR_OFFSET*CANVAS_SCALE_FACTOR of the origin size video stream.
     * @returns {number}
     */

  }, {
    key: "SCREEN_DETECTOR_OFFSET",
    get: function get() {
      return 2;
    }
    /**
     * Ratio used for defining how many pixels should be analysed from the screenshot. Ratio 3 will
     * use every 3th pixel from axis x and y means that ~11% of image pixel will be analysed.
     * Image 36x64 = 2304 pixels, with ratio 3 (36/3)x(64/3) = 256 pixels to be analysed
     * @return {number}
     */

  }, {
    key: "SCREEN_PIXEL_RATIO",
    get: function get() {
      return 3;
    }
  }]);
  return StreamCaptureService;
}();

exports.default = StreamCaptureService;