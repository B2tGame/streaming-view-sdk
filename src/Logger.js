const StreamingEvent = require('./StreamingEvent');


export default class Logger {
  /**
   *
   * @param {boolean} enableDebug If logging also should be displayed in the browser console.
   */
  constructor(enableDebug = true) {
    this.enableDebug = enableDebug;
  }

  /**
   *
   * @param type
   * @param args
   */
  logOutput(type, ...args) {
    if (this.enableDebug) {
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
