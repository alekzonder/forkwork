var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.setGlobalLogLevel('TRACE');

var Worker = require(__dirname + '/../../src/Worker');

// create worker object
var worker = new Worker(logger, {});

// setup worker
worker
    .postInit((resolve, reject) => {
        // init logger after init event
        worker.logger.category = 'worker-' + worker.config.id;
        log4js.setGlobalLogLevel(worker.config.logLevel);
        resolve();
    })
    .onTask((task) => {
        logger.info(`ECHO ${task.data.msg}`);
        task.done({echoDone: `ECHO ${task.data.msg}`});
    })
    .up()
    .then(() => {
        // all ok, send online to manager
        worker.online();
    })
    .catch((error) => {
        logger.error(error);
        process.exit(1);
    });
