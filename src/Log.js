import io from 'socket.io-client';
import url from 'url';

class Log {
    /**
     * Log
     * @param {string} endpoint
     */
    constructor(endpoint) {
        const endpointPart = url.parse(endpoint);
        this.socket = io(`${endpointPart.protocol}//${endpointPart.host}`, { path: `${endpointPart.path}/emulator-commands/socket.io` });
        this.state = {};

        this.socket.on('error', (err) => {
            console.log('Log: ', err);
        });
    }

    destructor() {
        if (this.socket) {
            this.socket.close();
        }
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
