'use strict';

var EventEmitter = require('events').EventEmitter;

class WorkerChannel {

    constructor(logger) {
        this._logger = logger;

        this._events = new EventEmitter();

        var messageTypes = [
            'init',
            'shutdown'
        ];

        process.on('message', (data) => {

            if (!data.type || messageTypes.indexOf(data.type) == -1) {
                var error = new Error('unknown message from fork');
                error.data = data;

                this._logger.error(error);

                this._send('fatal', error);
            }

            this._logger.trace(`got message ${data.type} with data:`, data.data);

            this._events.emit(data.type, data.data);
        });
    }

    onInit(cb) {
        this._events.once('init', cb);
    }

    onShutdown(cb) {
        this._events.once('shutdown', cb);
    }

    online() {
        this._send('online');
    }


    _send(type, data) {
        process.send({type: type, data: data});
    }

}

module.exports = WorkerChannel;