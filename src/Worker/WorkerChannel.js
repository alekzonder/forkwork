'use strict';

var EventEmitter = require('events').EventEmitter;

var Task = require('../Task');

/**
 * Fork to Manager channel
 *
 * @class
 */
class WorkerChannel {

    /**
     * @constructor
     * @param  {log4js} logger
     */
    constructor(logger) {
        this._logger = logger;

        this._events = new EventEmitter();

        var messageTypes = [
            'init',
            'shutdown',
            'task'
        ];

        process.on('message', (data) => {

            if (!data.type || messageTypes.indexOf(data.type) == -1) {
                var error = new Error('unknown message from fork');
                error.data = data;

                this._logger.error(error);

                this._send('fatal', error);
            }

            this._logger.trace(`got message`, data);

            this._events.emit(data.type, data.data);
        });
    }

    /**
     * onInit  callback
     *
     * @param  {Function} cb
     */
    onInit(cb) {
        this._events.once('init', cb);
    }

    /**
     * onShutdown callback
     *
     * @param  {Function} cb
     */
    onShutdown(cb) {
        this._events.once('shutdown', cb);
    }

    /**
     * onTask callback
     *
     * @param  {Function} cb
     */
    onTask(cb) {
        this._events.on('task', cb);
    }

    /**
     * send online event
     */
    online() {
        this._send('online');
    }

    /**
     * send taskStarted event
     *
     * @param  {Number} id
     */
    taskStarted(id) {
        this._send('taskStarted', id);
    }

    /**
     * send taskFinished event
     *
     * @param  {Number} id
     */
    taskFinished(id) {
        this._logger.trace('WorkerChannel.taskFinished', id);
        this._send('taskFinished', id);
    }

    /**
     * send taskError event
     *
     * @param  {Number} id
     */
    taskError(error) {
        this._send('taskError', this._processError(error));
    }

    /**
     * send taskFatal event
     *
     * @param  {Number} id
     */
    taskFatal(error) {
        this._send('taskFatal', this._processError(error));
    }

    /**
     * @private
     *
     * @param  {String} type
     * @param  {Object} data
     */
    _send(type, data) {
        var message = {type: type, data: data};
        this._logger.trace(`send message`, message);
        process.send(message);
    }

    /**
     * @private
     * @param  {Error} error
     * @return {Object}
     */
    _processError(error) {
        return {
            message: error.message,
            name: error.name,
            stack: error.stack,
            code: error.code
        };
    }

}

module.exports = WorkerChannel;
