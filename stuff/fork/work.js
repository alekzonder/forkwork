var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.configure({
    appenders: [
        {type: 'console'}
    ],
    levels: {
        '[all]': 'INFO'
    }
});

var EventEmitter = require('events').EventEmitter;

var Worker = require(__dirname + '/../../src/Worker');

var eventEmitter = new EventEmitter();

var config = {};

var worker = new Worker(logger, config, eventEmitter);

process.on('unhandledRejection', (error) => {
    logger.fatal(error);
});

worker
    .preInit((resolve, reject) => {
        resolve();
    })
    .postInit((resolve, reject) => {
        worker.logger.category = 'worker-' + worker.config.id;
        resolve();
    });

worker.up()
    .then(() => {

        // worker.onTask((task) => {
        //
        // });

        // worker.onShutdown((done) => {
        //     console.log('stuff');
        //     done();
        // });

        setTimeout(() => {
            // process.exit(1);
            worker.online();
        }, 500);

        worker.online();
    })
    .catch((error) => {
        logger.fatal(error);
    });
