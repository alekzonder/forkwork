var Manager = require(__dirname + '/../../src/Manager');

var log4js = require('log4js');

var logger = log4js.getLogger('simple');

log4js.setGlobalLogLevel('INFO');

if (typeof process.env.VERBOSE != 'undefined') {
    log4js.setGlobalLogLevel(process.env.VERBOSE);
}

// fork manager config
var config = {
    forkCount: 3,
    worker: {
        path: __dirname + '/worker',
    },
    cwd: __dirname
};


// create Manager object
var manager = new Manager(log4js, config);

// bind error and fatal callbacks for manager
manager
    .onError((error) => {
        logger.error(error.message);
        manager.exit(1);
    })
    .onFatal((error) => {
        logger.fatal(error.message);
        manager.exit(1);
    })
    .up()
    .then((workersCount) => {
        logger.info(`${workersCount} workers online`);

        var done = 0;

        // bind tasks events
        manager.tasks
            .onTaskStarted((id) => {
                logger.info(`task ${id} started`);
            })
            .onTaskFinished((id) => {
                done++;

                var task = manager.tasks.get(id);

                var result = task.result;

                logger.info(`task ${id} done with result = `, result);

                if (done === 3) {
                    logger.info('all tasks done');
                    manager.exit();
                }
            })
            .onTaskError((error) => {
                logger.error(error);
                manager.exit(1);
            })
            .onTaskFatal((error) => {
                logger.fatal(error);
                manager.exit(1);
            });


        // add tasks
        manager.tasks.add({
            type: 'echo',
            msg: '1'
        });
        manager.tasks.add({
            type: 'echo',
            msg: '2'
        });
        manager.tasks.add({
            type: 'echo',
            msg: '3'
        });
    })
    .catch((error) => {
        logger.fatal(error);
        process.exit(1);
    });
