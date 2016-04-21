var Manager = require(__dirname + '/../../src/Manager');

var logger = require('log4js').getLogger('manager');

var config = {
    forkCount: 3,
    worker: {
        path: './work',
        startupTimeout: 1000
    },
    cwd: process.cwd()
};


var manager = new Manager(logger, config);

manager.up()
    .then(() => {

        setTimeout(() => {

            manager.shutdown()
                .then(() => {
                    logger.debug('shutdown');
                })
                .catch((error) => {
                    logger.error(error);
                    process.exit(1);
                });

        }, 1000);

    })
    .catch((error) => {
        logger.fatal(error.message);
        logger.debug(error);
        process.exit(1);
    });
