import io from 'socket.io-client';
import url from 'url';

class Log {
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

    message(message, extra = undefined) {
        this.socket.emit(
            'message',
            JSON.stringify({
                type: 'log',
                timestamp: Date.now(),
                message: message,
                extra: extra,
            })
        );
    }
}

export default Log;
