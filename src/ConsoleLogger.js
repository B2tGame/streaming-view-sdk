export default class ConsoleLogger {
  constructor(enableDebug = true) {
    this.enableDebug = enableDebug;
  }

  logOutput(type, ...args) {
    if (this.enableDebug) {
      console[type]('Streaming SDK:', ...args);
    }
  }

  log(message, ...args) {
    this.logOutput('log', message, ...args);
  }

  info(message, ...args) {
    this.logOutput('info', message, ...args);
  }

  warn(message, ...args) {
    this.logOutput('warn', message, ...args);
  }

  error(message, ...args) {
    this.logOutput('error', message, ...args);
  }
}
