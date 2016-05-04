'use strict';

class ManagerWorkerChannel {

    constructor(logger, events, worker) {
        this._logger = logger;

        this._worker = null;

        if (worker) {
            this._worker = worker;
        }

        this._events = events;
    }

    onFatal(cb) {
        this._events.on('fatal', cb);
    }

    fatal(error, worker) {
        this._events.emit('fatal', error, (this._worker) ? this._worker : worker);
    }

    onError(cb) {
        this._events.on('error', cb);
    }

    error(error, worker) {
        this._events.emit('error', error, (this._worker) ? this._worker : worker);
    }

    onClose(cb) {
        this._events.on('close', cb);
    }

    close(code, worker) {
        this._events.emit('close', code, (this._worker) ? this._worker : worker);
    }

    onOnline(cb) {
        this._events.on('online', cb);
    }

    online(worker) {
        this._events.emit('online', (this._worker) ? this._worker : worker);
    }

}

module.exports = ManagerWorkerChannel;
