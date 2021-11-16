"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _uaParserJs = _interopRequireDefault(require("ua-parser-js"));

/**
 * thin wrapper around UAParser, for full info about browsers and devices, see:
 * https://github.com/faisalman/ua-parser-js#methods
 */
class UserAgentParser {
  constructor() {
    this.userAgentInfo = new _uaParserJs.default();
  }
  /**
   * @returns {UAParser.IResult}
   */


  get UA() {
    return this.userAgentInfo.getResult();
  }

  getBrowserName() {
    var _this$UA$browser$name;

    return (_this$UA$browser$name = this.UA.browser.name) !== null && _this$UA$browser$name !== void 0 ? _this$UA$browser$name : '';
  }

  isSupportedBrowser() {
    return UserAgentParser.supportedBrowsers.includes(this.getBrowserName().toLocaleLowerCase());
  }

}

exports.default = UserAgentParser;
UserAgentParser.supportedBrowsers = ['safari', 'mobile safari', 'chrome', 'chrome headless'];