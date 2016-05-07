'use strict';

var path = require('path');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var joi = require('joi');

var loggernesto = require('../loggernesto');

var defaultConfig = require('./config.default');

var Workers = require('./Workers');

var ManagerToWorkerChannel = require('./channels/ManagerToWorker');

/**
 * manager of workers
 *
 * @class
 */
class Manager {

    /**
     * @constructor
     *
     * @param  {logger} logger
     * @param  {Object} rawConfig
     */
    constructor(logger, rawConfig) {

        this._logger = this._wrap(logger, 'manager');

        this._rawConfig = rawConfig;

        this._config = null;

        this._workers = null;

        this._tasks = [];

        this._events = new EventEmitter();

        this._workerEvents = new EventEmitter();

        // general worker channel for all workers
        this._workerChannel = new ManagerToWorkerChannel(this._logger, this._workerEvents);

        this._logger.trace('constructor done');
    }

    /**
     * workers object getter
     *
     * @return {Workers}
     */
    get workers() {
        return this._workers;
    }

    /**
     * init and start workers
     *
     * @return {Promise}
     */
    up() {

        return new Promise((resolve, reject) => {

            this._logger.trace('up started');

            this._logger.debug(`manager pid = ${process.pid}`);

            this._initListeners();

            this._prepareConfig(this._rawConfig)
                .then((config) => {
                    this._config = config;

                    this._logger.debug('setup workers');

                    this._workers = new Workers(
                        this._logger.getLogger('workers'),
                        this._config,
                        this._workerEvents
                    );

                    return this._workers.setup();
                })
                .then(() => {
                    this._logger.debug('workers setup done');
                    return this._workers.up();
                })
                .then((workersCount) => {
                    this._logger.debug(`${workersCount} workers up`);
                    resolve(workersCount);
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    /**
     * shutdown workers and exit
     *
     * @return {Promise}
     */
    shutdown() {

        return new Promise((resolve, reject) => {

            this._workers.shutdown()
                .then(() => {
                    this._logger.debug('workers stopped');
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });

        });


    }

    /**
     * on Fatal error callback
     *
     * @param  {Function} cb
     */
    onFatal(cb) {
        this._events.on('fatal', cb);
    }

    /**
     * on Error callback
     *
     * @param  {Function} cb
     */
    onError(cb) {
        this._events.on('error', cb);
    }

    /**
     * on close callback
     *
     * @param  {Function} cb
     */
    onClose(cb) {
        this._events.on('close', cb);
    }

    /**
     * init manager listeners
     *
     * @private
     */
    _initListeners() {

        this._workerChannel.onFatal((error, worker) => {
            this._logger.trace('workerChannel:onFatal', error, worker.id);
            error.workerId = worker.id;
            this._events.emit('fatal', error);
        });

        this._workerChannel.onError((error, worker) => {
            this._logger.trace('workerChannel:noError', error, worker.id);
            error.workerId = worker.id;
            this._events.emit('error', error);
        });

        this._workerChannel.onClose((code, worker) => {
            this._logger.trace('workerChannel:onClose', code, worker.id);
            this._events.emit('close', code, worker);
        });

    }

    /**
     * prepare config fork work
     *
     * @private
     * @param  {Object} rawConfig
     * @return {Promise}
     */
    _prepareConfig(rawConfig) {

        return new Promise((resolve, reject) => {

            this._logger.debug('preparing config');

            var extendedConfig = _.defaultsDeep(rawConfig, defaultConfig);

            this._checkConfig(extendedConfig)
                .then((config) => {
                    if (!config.worker.cwd) {
                        config.worker.cwd = config.cwd;
                    }

                    config.worker.path = path.resolve(`${config.worker.cwd}/${config.worker.path}`);

                    config.worker.logLevel = config.logLevel;

                    resolve(config);
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    /**
     * check config format
     *
     * @private
     * @param  {Object} config
     * @return {Promise}
     */
    _checkConfig(config) {

        var configSchema = {
            forkCount: joi.number().required().min(1).max(100),
            worker: joi.object().required().keys({
                path: joi.string().required(),
                cwd: joi.string(),
                startupTimeout: joi.number().min(100).required()
            }),
            cwd: joi.string().required()
        };

        return new Promise((resolve, reject) => {

            joi.validate(config, configSchema, {
                allowUnknown: true
            }, (err, validConfig) => {
                if (err) {
                    return reject(err);
                }

                resolve(validConfig);
            });

        });

    }

    /**
     * wrap logger
     *
     * @param  {logger} logger
     * @param  {String} category
     * @return {LoggernestoWrapper}
     */
    _wrap(logger, category) {
        return loggernesto(logger, category);
    }
}

module.exports = Manager;
