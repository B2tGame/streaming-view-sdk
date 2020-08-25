

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
     * @param {string} type
     * @param {string} message
     * @param extra
     */
    message(type, message, extra = undefined) {
        this.socket.emit(
            'message',
            JSON.stringify({
                type: type,
                name: 'client-log',
                message: message,
                timestamp: Date.now(),
                extra: extra,
            })
        );
    }
}

export default Log;
