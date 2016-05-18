'use strict';

var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var WorkerChannel = require('./WorkerChannel');

var Task = require('../Task');

/**
 * Worker
 *
 * @class
 */
class ForkWorker {

    /**
     * @constructor
     * @param  {log4js-nested} logger
     * @param  {Object} config
     */
    constructor(logger, config) {

        this._logger = logger;
        this._config = config;

        this._events = new EventEmitter();

        this._workerChannel = new WorkerChannel(logger);

        this._preInit = null;
        this._postInit = null;

        this._shutdownCallback = null;

        this._task = null;

        this._i = null;
    }

    /**
     * id getter
     *
     * @return {String}
     */
    get id() {
        return this._config.id;
    }

    /**
     * logger getter
     *
     * @return {log4js-nested}
     */
    get logger() {
        return this._logger;
    }

    /**
     * config getter
     *
     * @return {Object}
     */
    get config() {
        return this._config;
    }

    /**
     * up worker
     *
     * @return {Promise}
     */
    up() {

        return new Promise((resolve, reject) => {

            this._workerChannel.onInit((config) => {

                this._logger.trace('got init event', config);

                // TODO check config
                this._config = config;

                new Promise((this._preInit) ? this._preInit : resolve => resolve())
                    .then(() => {
                        return this._init();
                    })
                    .then(() => {
                        return new Promise((this._postInit) ? this._postInit : resolve => resolve());
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });

        });

    }

    /**
     * send online event
     */
    online() {
        this._workerChannel.online();
    }

    /**
     * set preInit callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    preInit(cb) {
        this._preInit = cb;
        return this;
    }

    /**
     * set postInit callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    postInit(cb) {
        this._postInit = cb;
        return this;
    }

    /**
     * onShutdown callback
     *
     * @param  {Function} cb
     */
    onShutdown(cb) {
        this._shutdownCallback = cb;
        return this;
    }

    /**
     * onTask callback
     *
     * @param  {Function} cb
     */
    onTask(cb) {

        this._workerChannel.onTask((rawTask) => {
            this._task = new Task();
            this._task.unserialize(rawTask);
            this._task.bindTo(this._events);

            this._task.started();

            cb(this._task);
        });

        return this;

    }

    /**
     * onError callback
     *
     * @param  {Function} cb
     */
    onError(cb) {
        this._events.on('error', cb);
        return this;
    }

    /**
     * @private
     * @return {Promise}
     */
    _init() {

        return new Promise((resolve, reject) => {

            this._workerChannel.onShutdown(() => {
                var done = () => {
                    this._logger.debug(`worker ${this._config.id} shutdown`);
                    process.exit();
                };

                if (this._shutdownCallback) {
                    this._shutdownCallback(done);
                } else {
                    done();
                }
            });

            this._events.on('taskStarted', () => {
                this._workerChannel.taskStarted(this._task.id);
            });

            this._events.on('taskFinished', () => {
                this._logger.trace('Worker._events.on(taskFinished)', this._task.id);
                this._i = this._task.id;
                this._workerChannel.taskFinished(this._task.id);
                this._task = null;

            });

            this._events.on('taskError', (error) => {
                this._workerChannel.taskError(error);
            });

            this._events.on('taskFatal', (error) => {
                this._workerChannel.taskFatal(error);
            });

            resolve();
        });

    }

}

module.exports = ForkWorker;
