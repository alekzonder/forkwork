var Manager = require(__dirname + '/../../src/Manager');

var log4js = require('log4js');

var logger = log4js.getLogger('simple');

log4js.setGlobalLogLevel('INFO');

if (typeof process.env.VERBOSE != 'undefined') {
    log4js.setGlobalLogLevel(process.env.VERBOSE);
}

// fork manager config
var config = {
    forkCount: 10,
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

        var started = 0;
        var done = 0;

        // bind tasks events
        manager.tasks
            .onTaskStarted((id) => {
                // logger.info(`task ${id} started`);
            })
            .onTaskFinished((data) => {
                done++;

                logger.info(`task ${data.id} done with result = ${data.result}`);

                if (started && started === done && manager.tasks.isQueueEmpty()) {
                    logger.info('all tasks done');
                    logger.info('workers statistics');
                    console.log(manager.workers.getWorkersStat());
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


        for (var i = 0; i < 1000; i++) {
            manager.tasks.add({type: 'echo', msg: i});
            started++;
        }

    })
    .catch((error) => {
        logger.fatal(error);
        process.exit(1);
    });
