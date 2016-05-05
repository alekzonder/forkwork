'use strict';

var _ = require('lodash');

var Worker = require('./Worker');
var ManagerToWorkerChannel = require('./channels/ManagerToWorker');

class Workers {

    constructor(logger, config, workerEvents) {
        this._logger = logger;
        this._config = config;
        this._workerEvents = workerEvents;
        this._workers = {};
        this._workerChannels = {};
        this._i = 0;
    }

    setup() {

        return new Promise((resolve, reject) => {

            while (this._i < this._config.forkCount) {

                var newId = this._i;

                var workerConfig = _.cloneDeep(this._config.worker);
                workerConfig.id = newId;

                this._logger.debug(`starting worker ${newId}`);
                this._logger.trace(workerConfig);

                var workerLogger = this._logger.getLogger(`${newId}`);

                this._workers[newId] = new Worker(workerLogger, workerConfig);

                var workerChannelLogger = workerLogger.getLogger(`channel-${newId}`);

                this._workerChannels[newId] = new ManagerToWorkerChannel(
                    workerChannelLogger,
                    this._workerEvents,
                    this._workers[newId]
                );

                this._i++;
            }

            resolve();

        });

    }

    up() {
        var promises = [];

        _.each(this._workers, (worker, id) => {
            promises.push(worker.up(this._workerChannels[id]));
        });

        return Promise.all(promises);
    }

    shutdown() {

        return new Promise((resolve, reject) => {
            var promises = [];

            this._logger.debug('shutdown workers ...');

            _.each(this._workers, (worker, id) => {
                promises.push(worker.shutdown());
            });

            Promise.all(promises)
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }
}

module.exports = Workers;