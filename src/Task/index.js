'use strict';

/**
 * Task
 *
 * @class
 */
class Task {

    /**
     * @constructor
     * @param  {Number} id
     * @param  {object} data
     */
    constructor(id, data) {

        this._task  = {
            id: (id) ? id : null,
            data: (data) ? data : null,
            result: null,
            creationDate: this._getTime(),
            startDate: null,
            finishDate: null
        };

        this._events = null;
    }

    /**
     * id getter
     *
     * @return {String}
     */
    get id() {
        return this._task.id;
    }

    /**
     * data getter
     *
     * @return {Object}
     */
    get data() {
        // clone ??
        return this._task.data;
    }

    /**
     * result getter
     *
     * @return {*}
     */
    get result() {
        return this._task.result;
    }

    /**
     * result setter
     *
     * @param  {*} value
     */
    set result(value) {
        this._task.result = value;
    }

    /**
     * bind to EventEmitter
     *
     * @param  {EventEmitter} events
     */
    bindTo(events) {
        this._events = events;
    }

    /**
     * serialize task
     *
     * @return {String}
     */
    serialize() {
        return JSON.stringify(this._task);
    }

    /**
     * restore task from serialized string
     *
     * @param  {String} raw
     */
    unserialize(raw) {
        this._task = JSON.parse(raw);
    }

    /**
     * send task started event
     */
    started() {
        this._task.startDate = this._getTime();
        this._emit('taskStarted', this.id);
    }

    /**
     * send task finished event
     *
     * @param {Object} result
     */
    finished() {
        this._task.finishDate = this._getTime();
        this._emit('taskFinished', this.id);
    }

    /**
     * alias for finished
     */
    done(result) {
        this.result = result;
        this.finished();
    }

    /**
     * send task error event
     *
     * @param  {Error} error
     */
    error(error) {
        this._emit('taskError', error);
    }

    /**
     * send task fatal event
     *
     * @param  {Error} error
     */
    fatal(error) {
        this._emit('taskFatal', error);
    }

    /**
     * get execution time
     *
     * @return {Number}
     */
    getExecTime() {
        if (!this._task.startDate || !this._task.finishDate) {
            return null;
        }

        var time = (this._task.finishDate - this._task.startDate) / 1000;

        return time;
    }

    /**
     * @private
     * @return {Number}
     */
    _getTime() {
        return (new Date).getTime();
    }

    /**
     * @private
     * @param  {String} event
     * @param  {Object} data
     */
    _emit(event, data) {
        if (!this._events || !this._events.emit) {
            return;
        }

        this._events.emit(event, data);
    }

}

module.exports = Task;
