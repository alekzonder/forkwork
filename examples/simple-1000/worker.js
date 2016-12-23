var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.setGlobalLogLevel('INFO');

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

        // var timeout = ((worker.id == 0) ? 1 : worker.id) * 100;
        var timeout = 100;

        setTimeout(() => {
            logger.info(`ECHO ${task.data.msg}`);
            task.done(`ECHO ${task.data.msg}`);
        }, timeout);

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
