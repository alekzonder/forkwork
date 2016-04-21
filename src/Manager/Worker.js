'use strict';

var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var log4js = require('log4js');

var ForkChannel = require('./channels/WorkerFork');

class ForkWorker {

    constructor(logger, config) {

        this._logger = logger;

        this._config = config;

        this._fork = null;

        this._online = false;

        this._workerChannel = null;

        this._events = new EventEmitter();

        this._forkChannel = null;
    }

    get id() {
        return this._config.id;
    }

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

            this._forkChannel.onClose((code) => {
                if (code != 0) {
                    this._workerChannel.fatal(new Error(`worker exit with code = ${code}`));
                } else {
                    this._workerChannel.close();
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

    _init() {
        this._forkChannel.init({
            id: this._config.id
        });
    }

    shutdown() {
        return this._forkChannel.shutdown();
    }

}

module.exports = ForkWorker;