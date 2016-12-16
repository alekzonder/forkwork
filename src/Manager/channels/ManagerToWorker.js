'use strict';

/**
 * Manager to Worker communication channel
 *
 * @class
 */
class ManagerToWorkerChannel {

    /**
     * @constructor
     * @param  {log4js} logger
     * @param  {EventEmitter} events
     * @param  {ManagerWorker} worker
     */
    constructor (logger, events, worker) {
        this._logger = logger;
        this._worker = null;
        this._events = events;

        if (worker) {
            this._worker = worker;
        }
    }

    /**
     * onFatal callback
     *
     * @param  {Function} cb
     */
    onFatal (cb) {
        this._events.on('fatal', cb);
    }

    /**
     * fatal event emit
     *
     * @param  {error} error
     * @param  {ManagerWorker} worker
     */
    fatal (error, worker) {
        this._events.emit('fatal', error, (this._worker) ? this._worker : worker);
    }

    /**
     * onError callback
     *
     * @param  {Function} cb
     */
    onError (cb) {
        this._events.on('error', cb);
    }

    /**
     * error event emit
     *
     * @param  {Error} error
     * @param  {ManagerWorker} worker
     */
    error (error, worker) {
        this._events.emit('error', error, (this._worker) ? this._worker : worker);
    }

    /**
     * onClose callback
     *
     * @param  {Function} cb
     */
    onClose (cb) {
        this._events.on('close', cb);
    }

    /**
     * close event emit
     *
     * @param  {Number} code
     * @param  {ManagerWorker} worker
     */
    close (code, worker) {
        this._events.emit('close', code, (this._worker) ? this._worker : worker);
    }

    /**
     * onOnline callback
     *
     * @param  {Function} cb
     */
    onOnline (cb) {
        this._events.on('online', cb);
    }

    /**
     * online event emit
     *
     * @param  {ManagerWorker} worker
     */
    online (worker) {
        this._logger.trace(`online ${worker.id}`);
        this._events.emit('online', (this._worker) ? this._worker : worker);
    }

    /**
     * emit taskStarted event
     *
     * @param  {Object} data
     * @param  {ManagerWorker} worker
     */
    taskStarted (data, worker) {
        this._logger.trace(`taskStarted ${worker.id}`, data);
        this._events.emit('taskStarted', data, (this._worker) ? this._worker : worker);
    }

    /**
     * emit taskFinished
     *
     * @param  {Object} data
     * @param  {ManagerWorker} worker
     */
    taskFinished (data, worker) {
        this._logger.trace(`taskFinished ${worker.id}`, data);
        this._events.emit('taskFinished', data, (this._worker) ? this._worker : worker);
    }

    /**
     * emit taskError
     *
     * @param  {Error} error
     * @param  {ManagerWorker} worker
     */
    taskError (error, worker) {
        this._logger.trace(`taskError ${worker.id}`, error);
        this._events.emit('taskError', error, (this._worker) ? this._worker : worker);
    }

    /**
     * emit taskFatal
     *
     * @param  {Error} error
     * @param  {ManagerWorker} worker
     */
    taskFatal (error, worker) {
        this._logger.trace(`taskFatal ${worker.id}`, error);
        this._events.emit('taskFatal', error, (this._worker) ? this._worker : worker);
    }

}

module.exports = ManagerToWorkerChannel;
