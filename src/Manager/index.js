'use strict';

var path = require('path');
var EventEmitter = require('events').EventEmitter;

var log4js = require('log4js');
var _ = require('lodash');
var joi = require('joi');

var defaultConfig = require('./config.default');

var Worker = require('./Worker');
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
     * @param  {log4js} logger
     * @param  {Object} rawConfig
     */
    constructor(log4js, rawConfig) {

        this._log4js = log4js;

        this._logger = this._log4js.getLogger('manager');

        this._rawConfig = rawConfig;

        this._config = null;

        this._workers = {};

        this._tasks = [];

        this._events = new EventEmitter();

        this._workerEvents = new EventEmitter();

        this._workerChannel = new ManagerToWorkerChannel(this._logger, this._workerEvents);

        this._logger.trace('constructor done');
    }

    /**
     * init and start workers
     *
     * @return {Promise}
     */
    up() {

        return new Promise((resolve, reject) => {

            this._logger.trace('up started');

            this._initListeners();

            this._checkLoggerInterface()
                .then(() => {
                    return this._prepareConfig(this._rawConfig);
                })
                .then((config) => {

                    this._config = config;

                    this._logger.debug('up workers');

                    var promises = [];

                    for (var i = 0; i < this._config.forkCount; i++) {

                        var workerConfig = _.cloneDeep(this._config.worker);

                        workerConfig.id = i;

                        this._logger.debug(`starting worker ${i}`, workerConfig);

                        var workerLogger = this._log4js.getLogger(`manager-worker-${i}`);

                        this._workers[i] = new Worker(workerLogger, workerConfig);

                        var workerChannelLogger = this._log4js.getLogger(`workerChannel-${i}`);

                        var workerChannel = new ManagerToWorkerChannel(
                            workerChannelLogger,
                            this._workerEvents,
                            this._workers[i]
                        );

                        promises.push(this._workers[i].up(workerChannel));

                    }

                    Promise.all(promises)
                        .then((data) => {
                            this._logger.trace('workers up result', data);
                            resolve(data);
                        })
                        .catch((error) => {
                            reject(error);
                        });

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

            var promises = [];

            for (var id in this._workers) {
                this._logger.trace(`send 'shutdown' to worker ${id}`);
                promises.push(this._workers[id].shutdown());
            }

            Promise.all(promises)
                .then(() => {
                    resolve(true);
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

            this._logger.trace('preparing config');

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

            joi.validate(config, configSchema, {allowUnknown: true}, (err, validConfig) => {
                if (err) {
                    return reject(err);
                }

                resolve(validConfig);
            });

        });

    }

    /**
     * check logger interface methods
     *
     * @private
     * @return {Promise}
     */
    _checkLoggerInterface() {

        return new Promise((resolve, reject) => {

            this._logger.trace('checking logger interface');

            var methods = ['trace', 'debug', 'info', 'error', 'fatal'];

            _.each(methods, (method) => {

                if (
                    typeof this._logger[method] === 'undefined' ||
                    typeof this._logger[method] !== 'function'
                ) {
                    reject(new Error(`logger must have method ${method}`));
                    return false;
                }

            });

            resolve();
        });

    }
}

module.exports = Manager;
