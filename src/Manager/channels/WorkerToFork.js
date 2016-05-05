'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * @class
 */
class WorkerToForkChannel {

    /**
     * managerWorker to fork, fork to managerWorker communication
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

            this._logger.trace('got message', data);

            if (!data.type || messageTypes.indexOf(data.type) == -1) {
                var error = new Error('unknown message from fork');
                error.data = data;

                this._events.emit('fatal', error);
            }

            this._events.emit(data.type, data.data);
        });
    }

    /**
     * id getter
     *
     * @return {String}
     */
    get id() {
        return this._id;
    }

    /**
     * id setter
     *
     * @param  {String} id
     */
    set id (id) {
        this._id = id;
    }

    /**
     * onFatal callback
     *
     * @param  {Function} cb
     */
    onFatal(cb) {
        this._events.on('fatal', cb);
    }

    /**
     * onError callback
     *
     * @param  {Function} cb
     */
    onError(cb) {
        this._events.on('error', cb);
    }

    /**
     * onClose callback
     *
     * @param  {Function} cb
     */
    onClose(cb) {
        this._fork.on('close', cb);
    }

    /**
     * close fork channel
     *
     * @param  {Number} code
     */
    close(code) {
        this._closed = true;
        // this._events.emit('close', code, (this._worker) ? this._worker : worker);
    }

    /**
     * onOnline callback
     *
     * @param  {Function} cb
     */
    onOnline(cb) {
        this._events.once('online', cb);
    }

    /**
     * online event emit
     *
     * @param  {ManagerWorker} worker
     */
    online(worker) {
        this._events.emit('online', (this._worker) ? this._worker : worker);
    }

    /**
     * init worker
     *
     * @param  {Object} config
     */
    init(config) {
        this._send('init', config);
    }

    /**
     * shtdown worker
     *
     * @return {Promise}
     */
    shutdown() {

        return new Promise((resolve, reject) => {
            this._logger.trace(`shutdown. send to worker fork ${this._id}, wait for close`);


            this.onClose((code) => {
                this.close();
                this._logger.trace(`shutdown. got close with code = ${code}`);

                if (code == 0) {
                    resolve(true);
                } else {
                    reject(new Error(`fork shutdown failed. code = ${code}`));
                }
            });

            this._send('shutdown');
        });

    }

    /**
     * is fork channel closed
     *
     * @return {Boolean}
     */
    isClosed() {
        return this._closed;
    }

    /**
     * _send event to fork
     *
     * @private
     * @param  {String} type
     * @param  {Object} data
     */
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

module.exports = WorkerToForkChannel;
