'use strict';

var path = require('path');
var EventEmitter = require('events').EventEmitter;

var log4js = require('log4js');
var _ = require('lodash');
var joi = require('joi');

var defaultConfig = require('./config.default');

var Worker = require('./Worker');
var ManagerWorkerChannel = require('./channels/ManagerWorker');

class ForkManager {

    constructor(logger, rawConfig) {

        this._logger = logger;

        this._rawConfig = rawConfig;

        this._config = null;

        this._workers = {};

        this._tasks = [];

        this._events = new EventEmitter();

        this._workerEvents = new EventEmitter();

        this._workerChannel = new ManagerWorkerChannel(this._logger, this._workerEvents);
    }

    up() {

        return new Promise((resolve, reject) => {

            this._initListeners();

            this._prepareConfig(this._rawConfig)
                .then((config) => {

                    this._config = config;

                    this._logger.debug('up workers');

                    var promises = [];

                    for (var i = 0; i < this._config.forkCount; i++) {

                        var workerConfig = _.cloneDeep(this._config.worker);

                        workerConfig.id = i;

                        this._logger.debug(`starting worker ${i}`, workerConfig);

                        this._workers[i] = new Worker(this._logger, workerConfig);

                        var workerChannel = new ManagerWorkerChannel(
                            this._logger,
                            this._workerEvents,
                            this._workers[i]
                        );

                        promises.push(this._workers[i].up(workerChannel));

                    }

                    Promise.all(promises)
                        .then((data) => {
                            this._logger.trace('workers up result', data);
                            resolve();
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

    status() {
        return _.cloneDeep(this._workers);
    }

    onFatal(cb) {
        this._events.on('fatal', cb);
    }

    onError(cb) {
        this._events.on('error', cb);
    }

    onClose(cb) {
        this._events.on('close', cb);
    }

    _initListeners() {

        this._workerChannel.onFatal((error, worker) => {
            this._logger.trace(error, worker.id);
            error.workerId = worker.id;
            this._logger.fatal(error);
            this._events.emit('fatal', error);
        });

        this._workerChannel.onError((error, worker) => {
            this._logger.trace(error, worker.id);
            error.workerId = worker.id;
            this._logger.error(error);
            this._events.emit('error', error);
        });

        this._workerChannel.onClose((worker) => {
            this._logger.trace('close', worker.id);
            this._events.emit('close', worker.id);
        });

    }

    _prepareConfig(rawConfig) {

        return new Promise((resolve, reject) => {

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
}

module.exports = ForkManager;
