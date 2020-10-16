export default class Logger {

  constructor(isDebug) {
    this.isDebug = isDebug;
  }

  log(message) {
    if (this.isDebug) {
      console.log(message);
    }
  }
}