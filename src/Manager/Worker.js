'use strict';

var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var ForkChannel = require('./channels/WorkerToFork');

var Statuses = require('./WorkerStatuses');


/**
 * Abstraction for child_process.fork
 *
 * @class
 */
class ManagerWorker {

    /**
     * internal manager object for communcation with forks
     *
     * @constructor
     * @param  {logger} logger
     * @param  {Object} config
     */
    constructor (logger, config) {

        this._logger = logger;

        this._config = config;

        this._fork = null;

        this._online = false;

        this._workerChannel = null;

        this._events = new EventEmitter();

        this._forkChannel = null;

        this._shutdowning = false;

        this.statuses = Statuses;

        this._status = Statuses.FREE;

        this._task = null;

        this._stat = {
            started: 0,
            finished: 0,
            errored: 0,
            fataled: 0
        };
    }

    /**
     * worker id
     *
     * @return {Number}
     */
    get id () {
        return this._config.id;
    }

    /**
     * check worker status == FREE
     *
     * @return {Boolean}
     */
    isFree () {
        return this._status == Statuses.FREE;
    }

    isBusy () {
        return this._status == Statuses.BUSY;
    }

    /**
     * startup fork
     *
     * @param  {WorkerToForkChannel} workerChannel
     * @return {Promise}
     */
    up (workerChannel) {

        return new Promise((resolve, reject) => {

            if (!workerChannel) {
                return reject(new Error('no workerChannel for worker'));
            }

            this._workerChannel = workerChannel;


            this._fork = child.fork(this._config.path, this._config.args, this._config.options);

            this._forkChannel = new ForkChannel(this._logger.getLogger('fork-channel'), this._fork);

            this._forkChannel.id = this._config.id;

            var that = this;

            this._forkChannel.onClose((code) => {

                if (this._shutdowning) {
                    return;
                }

                this._forkChannel.close();

                if (code != 0) {
                    this._workerChannel.fatal(new Error(`worker "${this.id}" exit with code = ${code}`));
                    this._workerChannel.close(code, this);
                } else {
                    this._workerChannel.close(code, this);
                }
            });

            this._forkChannel.onFatal((error) => {
                if (!error) {
                    error = new Error('unknown error from fork');
                }
                this._workerChannel.fatal(error);
            });

            this._forkChannel.onError((error) => {
                if (!error) {
                    error = new Error('unknown error from fork');
                }
                this._workerChannel.error(error);
            });

            this._init();

            var timeout = setTimeout(() => {
                reject(new Error('startup timeout ' + this._config.startupTimeout + 'ms for worker ' + this.id));
            }, this._config.startupTimeout);


            this._forkChannel.onOnline(() => {
                this._logger.trace(`worker fork ${this._config.id} online`);
                clearTimeout(timeout);
                resolve(true);
            });

        });

    }

    /**
     * shutdown fork
     *
     * @return {Promise}
     */
    shutdown () {

        return new Promise((resolve, reject) => {

            if (this._forkChannel.isClosed()) {
                this._logger.trace('shutdown. fork channel already closed');
                return resolve();
            }

            this._shutdowning = true;

            this._forkChannel.shutdown()
                .then(() => {
                    this._logger.trace('shutdown. fork closed');
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    /**
     * send task to fork
     *
     * @param  {Task} task
     */
    sendTask (task) {
        if (!this.isFree()) {
            return false;
        }

        this._status = Statuses.BUSY;

        this._task = task;

        var raw = task.serialize();

        this._forkChannel.sendTask(raw);

        return true;
    }

    /**
     * get worker statistics
     *
     * @return {Object}
     */
    getStat () {
        return this._stat;
    }

    /**
     * init fork
     *
     * @private
     */
    _init () {
        this._logger.trace('bind fork channel events');

        this._forkChannel.init({
            id: this._config.id,
            logLevel: this._logger.level,
            initData: this._config.initData
        });

        this._forkChannel.onTaskStarted((data) => {
            this._stat.started++;
            this._workerChannel.taskStarted(data, this);
        });

        this._forkChannel.onTaskFinished((data) => {
            this._stat.finished++;

            this._logger.trace('got taskFinished', data);

            this._status = Statuses.FREE;

            this._workerChannel.taskFinished(data, this);
        });

        this._forkChannel.onTaskError((error) => {
            this._stat.error++;
            error.taskId = this._task.id;
            error.workerId = this.id;
            this._status = Statuses.FREE;
            this._workerChannel.taskError(this._makeError(error), this);
        });

        this._forkChannel.onTaskFatal((error) => {
            this._stat.fatal++;
            error.taskId = this._task.id;
            error.workerId = this.id;
            this._status = Statuses.FREE;
            this._workerChannel.taskFatal(this._makeError(error), this);
        });
    }

    /**
     * make error from object
     *
     * @param  {Object} data
     * @return {Error}
     */
    _makeError (data) {
        if (!data) {
            data = {
                message: 'unknown error'
            };
        }

        var error = new Error(data.message);
        error.code = data.code;
        error.stack = data.stack;
        error.taskId = data.taskId;
        error.workerId = data.workerId;

        return error;
    }

}

module.exports = ManagerWorker;
