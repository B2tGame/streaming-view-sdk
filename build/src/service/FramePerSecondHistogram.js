"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var FramePerSecondHistogram = /*#__PURE__*/function () {
  function FramePerSecondHistogram() {
    (0, _classCallCheck2.default)(this, FramePerSecondHistogram);
    this.data = '';
  }
  /**
   *
   * @param {number} fps
   */


  (0, _createClass2.default)(FramePerSecondHistogram, [{
    key: "inject",
    value: function inject(fps) {
      if (this.data.length < 1000) {
        this.data += this.fpsToSymbol(fps);
      }
    }
  }, {
    key: "addSeparator",
    value: function addSeparator() {
      this.data += "|";
    }
  }, {
    key: "getMetric",
    value: function getMetric() {
      return this.data;
    }
    /**
     * Convert fps value to a symbol that easy can be read over time.
     * @param {number} fps
     * @return {string}
     */

  }, {
    key: "fpsToSymbol",
    value: function fpsToSymbol(fps) {
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
  }]);
  return FramePerSecondHistogram;
}();

exports.default = FramePerSecondHistogram;