

class Log {
    /**
     * Log
     * @param socket
     */
    constructor(socket) {
        this.socket = socket;
    }

    /**
     *
     * @param {string} name
     * @param {string} message
     * @param extra
     */
    message(name, message, extra = undefined) {
        this.socket.emit(
            'message',
            JSON.stringify({
                type: 'log',
                name: name,
                message: message,
                timestamp: Date.now(),
                extra: extra,
            })
        );
    }
}

export default Log;
