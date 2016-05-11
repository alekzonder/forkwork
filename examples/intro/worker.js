var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.setGlobalLogLevel('INFO');

var Worker = require(__dirname + '/../../src/Worker');

// create worker object
var worker = new Worker(logger, {});

// setup worker
worker
    .onTask((task) => {
        logger.info(`ECHO ${task.data.msg}`);

        task.done();
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

