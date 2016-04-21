'use strict';

var _ = require('lodash');

var WorkerChannel = require('./WorkerChannel');

class ForkWorker {

    constructor(logger, config, eventEmitter) {
        this._logger = logger;
        this._config = config;
        this._events = eventEmitter;

        this._workerChannel = new WorkerChannel(logger);
    }

    up () {

        return new Promise((resolve, reject) => {

            this._workerChannel.onInit((config) => {

                this._logger.trace('got init event', config);

                // TODO check config
                this._config = config;

                this._init();

                resolve();
            });


        });

    }

    online() {
        this._workerChannel.online();
    }

    onShutdown(cb) {
        // var done = () => {
        //     process.exit();
        // };
        //
        // this._workerChannel.onShutdown(() => {
        //     cb(done);
        // });
    }

    _init() {
        this._workerChannel.onShutdown(() => {
            this._logger.debug(`worker ${this._config.id} shutdown`);
            process.exit();
        });
    }

}

module.exports = ForkWorker;
