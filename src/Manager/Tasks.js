'use strict';

var EventEmitter = require('events').EventEmitter;

var Task = require('../Task');

/**
 * Tasks
 * @class
 */
class Tasks {

    /**
     * @constructor
     * @param  {logger} logger
     * @param  {Object} config
     */
    constructor(logger, config) {
        this._logger = logger;
        this._config = config;

        this._tasks = {};

        this._queue = [];

        this._nextId = 0;
        this._events = new EventEmitter();
    }

    /**
     * add new task to queue
     *
     * @param {Object} data
     * @return {Task}
     */
    add(data) {
        var task = this.createTask(data);

        this._tasks[task.id] = task;

        this._queue.push(task.id);

        this._events.emit('taskAdded', task);

        return task;
    }

    /**
     * get next task from queue
     *
     * @return {Task}
     */
    getNextTask() {

        if (!this._queue.length) {
            return null;
        }

        var id = this._queue.shift();

        return this._tasks[id];
    }

    /**
     * add task by id to queue
     *
     * @param  {Number} id
     */
    returnToQueue(id) {
        if (!this._tasks[id]) {
            return;
        }

        this._queue.push(id);
    }

    /**
     * create task with add to queue
     *
     * @param  {Object} data
     * @return {Task}
     */
    createTask(data) {
        var id = this._generateNewId();

        var task = new Task(id, data);

        task.bindTo(this._events);

        return task;
    }

    /**
     * onTaskAdded callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    onTaskAdded(cb) {
        this._events.on('taskAdded', cb);
        return this;
    }

    /**
     * onTaskStarted callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    onTaskStarted(cb) {
        this._events.on('taskStarted', cb);
        return this;
    }

    /**
     * onTaskFinished callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    onTaskFinished(cb) {
        this._events.on('taskFinished', cb);
        return this;
    }

    /**
     * onTaskError
     *
     * @param  {Function} cb
     * @return {this}
     */
    onTaskError(cb) {
        this._events.on('taskError', cb);
        return this;
    }

    /**
     * onTaskFatal callback
     *
     * @param  {Function} cb
     * @return {this}
     */
    onTaskFatal(cb) {
        this._events.on('taskFatal', cb);
        return this;
    }

    /**
     * get queue size
     *
     * @return {Number}
     */
    getQueueSize() {
        return this._queue.length;
    }

    /**
     * is queue empty
     *
     * @return {Boolean}
     */
    isQueueEmpty() {
        return this.getQueueSize() == 0;
    }

    /**
     * get task by id
     *
     * @param  {String} id
     * @return {Task|Null}
     */
    get(id) {
        if (!this._tasks[id]) {
            return null;
        }
        return this._tasks[id];
    }

    /**
     * mark task as started
     *
     * @param  {String} id
     */
    markStarted(id) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markStarted`);
        }

        task.started();
    }

    /**
     * mark task as finished
     *
     * @param  {String} id
     */
    markFinished(id) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markFinished`);
            return;
        }

        task.finished();
    }

    /**
     * mark task as errored
     *
     * @param  {String} id
     * @param  {Error} error
     */
    markErrored(id, error) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markErrored`);
        }

        task.error(error);
    }

    /**
     * mark task as fataled
     *
     * @param  {String} id
     * @param  {Error} error
     */
    markFatal(id, error) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markFatal`);
            return;
        }

        task.fatal(error);
    }

    setResult(id, result) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on setResult`);
            return false;
        }

        task.result = result;

        return true;
    }

    /**
     * generate new id
     *
     * @private
     * @return {String}
     */
    _generateNewId() {
        this._nextId++;
        return 't' + this._nextId;
    }

}

module.exports = Tasks;
