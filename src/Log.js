class Log {
  /**
   * Log
   * @param {{}} socket
   */
  constructor(socket) {
    this.socket = socket;
  }

  /**
   * Logs state changes from the front-end
   * @param {string} type
   * @param {string} state
   * @param {{}} extra
   */
  state(type, state, extra = undefined) {
    this.socket.emit(
      'message',
      JSON.stringify({
        type: type,
        name: 'client-log',
        state: state,
        timestamp: Date.now(),
        extra: extra,
      })
    );
  }

  /**
   * Logs error message with details from the front-end
   * @param {{}} extra
   */
  error(extra = undefined) {
    this.socket.emit(
      'message',
      JSON.stringify({
        type: 'error',
        name: 'client-error',
        timestamp: Date.now(),
        extra: extra,
      })
    );
  }
}

export default Log;