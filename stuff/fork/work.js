var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.setGlobalLogLevel('INFO');

var Worker = require(__dirname + '/../../src/Worker');

var config = {};

var worker = new Worker(logger, config);

process.on('unhandledRejection', (error) => {
    logger.fatal(error);
});

worker
    .preInit((resolve, reject) => {
        resolve();
    })
    .postInit((resolve, reject) => {
        worker.logger.category = 'worker-' + worker.config.id;
        log4js.setGlobalLogLevel(worker.config.logLevel);
        resolve();
    });

worker.up()
    .then(() => {


        worker.onTask((task) => {
            setTimeout(() => {
                task.done();
            }, 500);
        });

        worker.onShutdown((done) => {
            done();
        });

        worker.online();
    })
    .catch((error) => {
        logger.fatal(error);
    });
