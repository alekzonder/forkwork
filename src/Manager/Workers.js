'use strict';

var _ = require('lodash');

var Worker = require('./Worker');
var ManagerToWorkerChannel = require('./channels/ManagerToWorker');

/**
 * worker manager
 *
 * @class
 */
class Workers {

    /**
     * @constructor
     * @param  {log4js-nested} logger
     * @param  {Object} config
     * @param  {EventEmitter} workerEvents
     */
    constructor (logger, config, workerEvents) {
        this._logger = logger;
        this._config = config;
        this._workerEvents = workerEvents;
        this._workers = {};
        this._workerChannels = {};
        this._i = 0;
    }

    /**
     * workers getter
     *
     * @return {Object}
     */
    get workers () {
        return this._workers;
    }

    /**
     * setup worker objects before fork
     *
     * @return {Promise}
     */
    setup () {

        return new Promise((resolve, reject) => {

            while (this._i < this._config.forkCount) {

                var newId = this._i;

                var workerConfig = _.cloneDeep(this._config.worker);
                workerConfig.id = newId;

                this._logger.debug(`setup worker ${newId}`);
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

    /**
     * fork worker processes
     *
     * @return {Promise}
     */
    up () {

        return new Promise((resolve, reject) => {
            var promises = [];

            this._logger.debug('forking workers');

            _.each(this._workers, (worker, id) => {
                this._logger.debug(`fork worker ${id}`);
                promises.push(worker.up(this._workerChannels[id]));
            });

            Promise.all(promises)
                .then((result) => {
                    resolve(result.length);
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    /**
     * shutdown workers
     *
     * @return {Promise}
     */
    shutdown () {

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

    /**
     * get worker by id
     *
     * @param  {Number} id
     * @return {ManagerWorker}
     */
    get (id) {
        if (!this._workers[id]) {
            return null;
        }

        return this._workers[id];
    }

    /**
     * get worker with status === FREE
     *
     * @return {Null|ManagerWorker}
     */
    getFreeWorker () {
        var free;

        for (var i in this._workers) {

            var worker = this._workers[i];

            if (worker.isFree()) {
                free = worker;
                break;
            }

        }

        return free;
    }

    /**
     * get all workers statistiscs
     *
     * @return {Object}
     */
    getWorkersStat () {
        var stat = {};

        for (var i in this._workers) {
            var worker = this._workers[i];
            stat[i] = worker.getStat();
        }

        return stat;
    }

    /**
     * onTaskStarted callback
     *
     * @param  {Function} cb
     */
    onTaskStarted (cb) {
        this._workerEvents.on('taskStarted', cb);
    }

    /**
     * onTaskFinished callback
     *
     * @param  {Function} cb
     */
    onTaskFinished (cb) {
        this._workerEvents.on('taskFinished', cb);
    }

    /**
     * onTaskError callback
     *
     * @param  {Function} cb
     */
    onTaskError (cb) {
        this._workerEvents.on('taskError', cb);
    }

    /**
     * onTaskFatal callback
     *
     * @param  {Function} cb
     */
    onTaskFatal (cb) {
        this._workerEvents.on('taskFatal', cb);
    }
}

module.exports = Workers;
