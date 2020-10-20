export default class ConsoleLogger {
  constructor(enableDebug = true) {
    this.enableDebug = enableDebug;
  }

  logOutput(type, message, ...args) {
    if (this.enableDebug) {
      if (args.length === 0) {
        console[type](message);
      } else {
        console[type](message, ...args);
      }
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
