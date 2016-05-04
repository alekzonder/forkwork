'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * @class
 */
class WorkerForkChannel {

    /**
     * manager -> worker, worker <- manager communication layer
     *
     * @constructor
     * @param  {logger} logger
     * @param  {ChildProcess} fork
     */
    constructor(logger, fork) {
        this._id = null;

        this._logger = logger;

        this._fork = fork;

        this._events = new EventEmitter();

        this._closed = false;

        var messageTypes = [
            'online'
        ];

        this._fork.on('message', (data) => {

            if (!data.type || messageTypes.indexOf(data.type) == -1) {
                var error = new Error('unknown message from fork');
                error.data = data;

                this._events.emit('fatal', error);
            }

            this._events.emit(data.type, data.data);
        });
    }

    get id() {
        return this._id;
    }

    set id (id) {
        this._id = id;
    }

    onFatal(cb) {
        this._events.on('fatal', cb);
    }

    fatal(error) {
        // this._events.emit('fatal', error, this._fork);
    }

    onError(cb) {
        this._events.on('error', cb);
    }

    error(error, worker) {
        this._events.emit('error', error, (this._worker) ? this._worker : worker);
    }

    onClose(cb) {
        this._fork.on('close', cb);
    }

    close(code, worker) {
        this._closed = true;
        this._events.emit('close', code, (this._worker) ? this._worker : worker);
    }

    onOnline(cb) {
        this._events.once('online', cb);
    }

    online(worker) {
        this._events.emit('online', (this._worker) ? this._worker : worker);
    }

    init(config) {
        this._send('init', config);
    }

    shutdown() {

        return new Promise((resolve, reject) => {
            this._logger.trace(`send 'shutdown' to worker fork ${this._id}`);
            this._send('shutdown');

            this.onClose((code) => {
                if (code == 0) {
                    resolve(true);
                } else {
                    reject(new Error(`fork shutdown failed. code = ${code}`));
                }
            });
        });

    }

    isClosed() {
        return this._closed;
    }

    _send(type, data) {
        if (this._closed) {
            this._logger.debug(`can't send message to fork, channel closed`, data);
            return;
        }

        this._fork.send({
            type: type,
            data: data
        });
    }

}

module.exports = WorkerForkChannel;
