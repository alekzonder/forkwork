'use strict';

var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

var ForkChannel = require('./channels/WorkerFork');

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
    constructor(logger, config) {

        this._logger = logger;

        this._config = config;

        this._fork = null;

        this._online = false;

        this._workerChannel = null;

        this._events = new EventEmitter();

        this._forkChannel = null;
    }

    /**
     * worker id
     *
     * @return {String}
     */
    get id() {
        return this._config.id;
    }

    /**
     * startup fork
     *
     * @param  {WorkerForkChannel} workerChannel
     * @return {Promise}
     */
    up(workerChannel) {

        return new Promise((resolve, reject) => {

            if (!workerChannel) {
                return reject(new Error('no workerChannel for worker'));
            }

            this._workerChannel = workerChannel;

            this._logger.setLevel(this._config.logLevel);

            this._fork = child.fork(this._config.path, {
                cwd: this._config.cwd,
                silent: false
            });

            this._forkChannel = new ForkChannel(this._logger, this._fork);

            this._forkChannel.id = this._config.id;

            var that = this;

            this._forkChannel.onClose((code) => {
                this._forkChannel.close();

                if (code != 0) {
                    this._workerChannel.fatal(new Error(`worker "${this.id}" exit with code = ${code}`));
                    this._workerChannel.close(code, this);
                } else {
                    this._workerChannel.close(code, this);
                }
            });

            this._forkChannel.onFatal((error) => {
                this._workerChannel.fatal(error);
            });

            this._forkChannel.onError((error) => {
                this._workerChannel.error(error);
            });

            this._init();

            var timeout = setTimeout(() => {
                reject(new Error('startup timeout for worker ' + this.id));
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
    shutdown() {

        return new Promise((resolve, reject) => {

            if (this._forkChannel.isClosed()) {
                return resolve();
            }

            this._forkChannel.shutdown()
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });

        });


    }

    /**
     * init fork
     *
     * @private
     */
    _init() {
        this._forkChannel.init({
            id: this._config.id
        });
    }

}

module.exports = ManagerWorker;
