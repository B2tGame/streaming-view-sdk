"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _StreamingEvent = _interopRequireDefault(require("./StreamingEvent"));

/**
 * Logger class for logging to browser console.
 */
class Logger {
  /**
   * Get if global verbose mode is enable or disabled.
   * @return {boolean}
   */
  static isVerboseEnabled() {
    return (window || {}).applandStreamingVerboseModeEnabled || false;
  }
  /**
   * Enable global verbose mode to console
   * @return {boolean}
   */


  static enableVerboseMode() {
    (window || {}).applandStreamingVerboseModeEnabled = true;
    return Logger.isVerboseEnabled();
  }
  /**
   * Disable global verbose mode to console
   * @return {boolean}
   */


  static disabledVerboseMode() {
    (window || {}).applandStreamingVerboseModeEnabled = false;
    return Logger.isVerboseEnabled();
  }
  /**
   *
   * @param {string} type The type must be "log", "info", "warn" or "error"
   * @param {*[]} args
   */


  logOutput(type) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (Logger.isVerboseEnabled()) {
      console[type]('Streaming SDK:', ...args);
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


  log(message) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    this.logOutput('log', message, ...args);
  }
  /**
   *
   * @param {string} message
   * @param {*[]} args
   */


  info(message) {
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    this.logOutput('info', message, ...args);
  }
  /**
   *
   * @param {string} message
   * @param {*[]} args
   */


  warn(message) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }

    this.logOutput('warn', message, ...args);
  }
  /**
   *
   * @param {string} message
   * @param {*[]} args
   */


  error(message) {
    for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }

    this.logOutput('error', message, ...args);
  }

}

exports.default = Logger;