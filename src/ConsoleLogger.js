export default class ConsoleLogger {

  constructor(enableDebug) {
    this.enableDebug = enableDebug;
  }

  log(message, ...args) {
    if (this.enableDebug) {
      console.log(message, args);
    }
  }
}