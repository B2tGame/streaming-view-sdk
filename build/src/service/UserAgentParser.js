"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _uaParserJs = _interopRequireDefault(require("ua-parser-js"));

/**
 * thin wrapper around UAParser, for full info about browsers and devices, see:
 * https://github.com/faisalman/ua-parser-js#methods
 */
var UserAgentParser = /*#__PURE__*/function () {
  function UserAgentParser() {
    (0, _classCallCheck2.default)(this, UserAgentParser);
    this.userAgentInfo = new _uaParserJs.default();
  }
  /**
   * @returns {UAParser.IResult}
   */


  (0, _createClass2.default)(UserAgentParser, [{
    key: "UA",
    get: function get() {
      return this.userAgentInfo.getResult();
    }
  }, {
    key: "getBrowserName",
    value: function getBrowserName() {
      var _this$UA$browser$name;

      return (_this$UA$browser$name = this.UA.browser.name) !== null && _this$UA$browser$name !== void 0 ? _this$UA$browser$name : '';
    }
  }, {
    key: "isSupportedBrowser",
    value: function isSupportedBrowser() {
      var _context;

      return (0, _includes.default)(_context = UserAgentParser.supportedBrowsers).call(_context, this.getBrowserName().toLocaleLowerCase());
    }
  }]);
  return UserAgentParser;
}();

exports.default = UserAgentParser;
UserAgentParser.supportedBrowsers = ['safari', 'mobile safari', 'chrome', 'chrome headless'];