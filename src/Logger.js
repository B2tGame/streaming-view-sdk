export default class Logger {

  constructor(enableDebug) {
    this.enableDebug = enableDebug;
  }

  log(message) {
    if (this.enableDebug) {
      console.log(message);
    }
  }
}