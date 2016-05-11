'use strict';

/**
 * @class
 */
class LoggernestoWrapper {

    /**
     * @constructor
     *
     * @param  {log4js} log4js
     * @param  {String} category
     */
    constructor(log4js, category) {
        // TODO check log4js

        this.iAmLoggernesto = true;
        this._category = 'default';
        this._log4js = log4js;

        if (category) {
            this._category = category;
        }

        this._logger = this._log4js.getLogger(this._category);
    }

    /**
     * get new logger
     *
     * @param  {String} category
     * @return {LoggernestoWrapper}
     */
    getLogger(category) {
        return new LoggernestoWrapper(this._log4js, `${this._category}.${category}`);
    }

    /**
     * log level
     *
     * @return {String}
     */
    get level() {
        // TODO
        return this._logger.level.levelStr;
    }

    /**
     * set logLevel
     */
    setLevel() {
        this._logger.setLevel.apply(this._logger, arguments);
    }

    /**
     * trace wrap
     */
    trace() {
        this._logger.trace.apply(this._logger, arguments);
    }

    /**
     * debug wrap
     */
    debug() {
        this._logger.debug.apply(this._logger, arguments);
    }

    /**
     * info wrap
     */
    info() {
        this._logger.info.apply(this._logger, arguments);
    }

    /**
     * warn wrap
     */
    warn() {
        this._logger.warn.apply(this._logger, arguments);
    }

    /**
     * error wrap
     */
    error() {
        this._logger.error.apply(this._logger, arguments);
    }

    /**
     * fatal wrap
     */
    fatal() {
        this._logger.fatal.apply(this._logger, arguments);
    }

}

module.exports = LoggernestoWrapper;
