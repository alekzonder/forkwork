'use strict';

var EventEmitter = require('events').EventEmitter;

var Task = require('../Task');

class Tasks {

    constructor(logger, config) {
        this._logger = logger;
        this._config = config;

        this._tasks = {};

        this._queue = [];

        this._nextId = 0;
        this._events = new EventEmitter();
    }

    add(data) {
        var task = this.createTask(data);

        this._tasks[task.id] = task;

        this._queue.push(task.id);

        this._events.emit('taskAdded', task);

        return task;
    }

    getNextTask() {

        if (!this._queue.length) {
            return null;
        }

        var id = this._queue.shift();

        return this._tasks[id];
    }

    createTask(data) {
        var id = this._generateNewId();

        var task = new Task(id, data);

        task.bindTo(this._events);

        return task;
    }

    onTaskAdded(cb) {
        this._events.on('taskAdded', cb);
        return this;
    }

    onTaskStarted(cb) {
        this._events.on('taskStarted', cb);
        return this;
    }

    onTaskFinished(cb) {
        this._events.on('taskFinished', cb);
        return this;
    }

    onTaskError(cb) {
        this._events.on('taskError', cb);
        return this;
    }

    onTaskFatal(cb) {
        this._events.on('taskFatal', cb);
        return this;
    }

    getQueueSize() {
        return this._queue.length;
    }

    isQueueEmpty() {
        return this.getQueueSize() == 0;
    }

    get(id) {
        if (!this._tasks[id]) {
            return null;
        }
        return this._tasks[id];
    }

    markStarted(id) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markStarted`);
        }

        task.started();
    }

    markFinished(id) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markFinished`);
        }

        task.finished();
    }

    markErrored(id, error) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markErrored`);
        }

        task.error(error);
    }

    markFatal(id, error) {
        var task = this.get(id);

        if (!task) {
            this._logger.error(`no task ${id} on markFatal`);
        }

        task.fatal(error);
    }

    _generateNewId() {
        this._nextId++;
        return this._nextId;
    }

}

module.exports = Tasks;
