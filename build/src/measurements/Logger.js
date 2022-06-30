"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _StreamingEvent = _interopRequireDefault(require("./StreamingEvent"));

/**
 * Logger class for logging to browser console.
 */
var Logger = /*#__PURE__*/function () {
  function Logger() {
    (0, _classCallCheck2.default)(this, Logger);
  }

  (0, _createClass2.default)(Logger, [{
    key: "logOutput",
    value:
    /**
     *
     * @param {string} type The type must be "log", "info", "warn" or "error"
     * @param {*[]} args
     */
    function logOutput(type) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (type === 'error' || type === 'warn' || Logger.isVerboseEnabled()) {
        var _console, _context;

        (_console = console)[type].apply(_console, (0, _concat.default)(_context = ['Streaming SDK:']).call(_context, args));
      }

      _StreamingEvent.default.emit(_StreamingEvent.default.LOG, {
        type: type,
        data: args
      });
    }
    /**
     *
     * @param {string} message
     * @param {*[]} args
     */

  }, {
    key: "log",
    value: function log(message) {
      var _context2;

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      this.logOutput.apply(this, (0, _concat.default)(_context2 = ['log', message]).call(_context2, args));
    }
    /**
     *
     * @param {string} message
     * @param {*[]} args
     */

  }, {
    key: "info",
    value: function info(message) {
      var _context3;

      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      this.logOutput.apply(this, (0, _concat.default)(_context3 = ['info', message]).call(_context3, args));
    }
    /**
     *
     * @param {string} message
     * @param {*[]} args
     */

  }, {
    key: "warn",
    value: function warn(message) {
      var _context4;

      for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }

      this.logOutput.apply(this, (0, _concat.default)(_context4 = ['warn', message]).call(_context4, args));
    }
    /**
     *
     * @param {string} message
     * @param {*[]} args
     */

  }, {
    key: "error",
    value: function error(message) {
      var _context5;

      for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
      }

      this.logOutput.apply(this, (0, _concat.default)(_context5 = ['error', message]).call(_context5, args));
    }
  }], [{
    key: "isVerboseEnabled",
    value:
    /**
     * Get if global verbose mode is enable or disabled.
     * @return {boolean}
     */
    function isVerboseEnabled() {
      return (window || {}).applandStreamingVerboseModeEnabled || false;
    }
    /**
     * Enable global verbose mode to console
     * @return {boolean}
     */

  }, {
    key: "enableVerboseMode",
    value: function enableVerboseMode() {
      (window || {}).applandStreamingVerboseModeEnabled = true;
      return Logger.isVerboseEnabled();
    }
    /**
     * Disable global verbose mode to console
     * @return {boolean}
     */

  }, {
    key: "disabledVerboseMode",
    value: function disabledVerboseMode() {
      (window || {}).applandStreamingVerboseModeEnabled = false;
      return Logger.isVerboseEnabled();
    }
  }]);
  return Logger;
}();

exports.default = Logger;