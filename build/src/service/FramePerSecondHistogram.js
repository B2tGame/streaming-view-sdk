"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class FramePerSecondHistogram {
  constructor() {
    this.data = '';
  }
  /**
   *
   * @param {number} fps
   */


  inject(fps) {
    if (this.data.length < 1000) {
      this.data += this.fpsToSymbol(fps);
    }
  }

  addSeparator() {
    this.data += "|";
  }

  getMetric() {
    return this.data;
  }
  /**
   * Convert fps value to a symbol that easy can be read over time.
   * @param {number} fps
   * @return {string}
   */


  fpsToSymbol(fps) {
    if (fps < 25) {
      return '<'; // less then 25
    } else if (fps < 45) {
      return '«'; // 25 to 45
    } else if (fps < 55) {
      return '‹'; // 45 to 55
    } else if (fps < 65) {
      return '*'; // 55 to 65
    } else if (fps < 75) {
      return '›'; // 65 to 75
    } else if (fps < 85) {
      return '»'; // 75 to 85
    } else {
      return '>'; // more then 85
    }
  }

}

exports.default = FramePerSecondHistogram;