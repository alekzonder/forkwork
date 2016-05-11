'use strict';

/**
 * Task Director
 * @class
 */
class Director {

    /**
     * @constructor
     * @param  {LoggernestoWrapper} logger
     * @param  {Workers} workers
     * @param  {Tasks} tasks
     * @param  {EventEmitter} globalEvents
     */
    constructor(logger, workers, tasks, globalEvents) {
        this._logger = logger;
        this._workers = workers;
        this._tasks = tasks;
        this._globalEvents = globalEvents;
    }

    /**
     * init
     *
     * @return {Promise}
     */
    init() {

        return new Promise((resolve, reject) => {

            this._bindEvents();

            resolve();

        });

    }

    /**
     * @private
     */
    _bindEvents() {

        this._tasks.onTaskAdded((task) => {

            // проверить есть ли свободный worker
            // если есть отправляем ему таск
            // если нет он отправиться когда завершится задача

            var worker = this._workers.getFreeWorker();

            if (!worker) {
                this._logger.trace(`no free workers for new task`);
                return;
            }

            var task = this._tasks.getNextTask();

            if (!task) {
                this._logger.warn('queue empty on TaskAdded event');
                return;
            }

            this._logger.trace(`got free worker ${worker.id} for new task`);

            this._logger.debug(`send next task ${task.id} to worker ${worker.id}`);

            worker.sendTask(task);
        });

        this._workers.onTaskStarted((data) => {
            this._logger.trace(`task ${data.taskId} started with worker ${data.workerId}`);
            this._tasks.markStarted(data.taskId);
        });

        this._workers.onTaskFinished((data) => {
            this._logger.debug(`task ${data.taskId} finished with worker ${data.workerId}`);

            this._tasks.markFinished(data.taskId);

            var task = this._tasks.getNextTask();

            if (!task) {
                this._logger.trace('queue empty');
                return;
            }

            var worker = this._workers.get(data.workerId);

            if (!worker) {
                this._logger.error(`no worker ${data.workerId} after TaskFinished`);
                return;
            }

            this._logger.debug(`send next task ${task.id} to worker ${worker.id}`);

            worker.sendTask(task);
        });

        this._workers.onTaskError((error) => {
            this._logger.trace(error);
            this._tasks.markErrored(error.taskId, error);
        });

        this._workers.onTaskFatal((error) => {
            this._logger.trace(error);
            this._tasks.markFatal(error.taskId, error);
        });

    }

}

module.exports = Director;
