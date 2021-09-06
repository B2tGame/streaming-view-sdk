import StreamingEvent from './StreamingEvent';

/**
 * Logger class for logging to browser console.
 */
export default class Logger {

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
    return Logger.isVerboseEnabled();
  }

  /**
   *
   * @param {string} type The type must be "log", "info", "warn" or "error"
   * @param {*[]} args
   */
  logOutput(type, ...args) {
    if (Logger.isVerboseEnabled()) {
      console[type]('Streaming SDK:', ...args);
    }
    StreamingEvent.emit(StreamingEvent.LOG, { type: type, data: args });
  }

  /**
   *
   * @param {string} message
   * @param {*[]} args
   */
  log(message, ...args) {
    this.logOutput('log', message, ...args);
  }

  /**
   *
   * @param {string} message
   * @param {*[]} args
   */
  info(message, ...args) {
    this.logOutput('info', message, ...args);
  }

  /**
   *
   * @param {string} message
   * @param {*[]} args
   */
  warn(message, ...args) {
    this.logOutput('warn', message, ...args);
  }

  /**
   *
   * @param {string} message
   * @param {*[]} args
   */
  error(message, ...args) {
    this.logOutput('error', message, ...args);
  }
}
