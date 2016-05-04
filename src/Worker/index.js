'use strict';

var _ = require('lodash');

var WorkerChannel = require('./WorkerChannel');

class ForkWorker {

    constructor(logger, config, eventEmitter) {

        this._logger = logger;
        this._config = config;
        this._events = eventEmitter;

        this._workerChannel = new WorkerChannel(logger);

        this._preInit = null;
        this._postInit = null;

        this._shutdownCallback = null;
    }

    get logger() {
        return this._logger;
    }

    get config() {
        return this._config;
    }

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

    online() {
        this._workerChannel.online();
    }

    onShutdown(cb) {
        this._shutdownCallback = cb;
    }

    preInit(cb) {
        this._preInit = cb;
        return this;
    }

    postInit(cb) {
        this._postInit = cb;
        return this;
    }

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

            resolve();
        });

    }

}

module.exports = ForkWorker;