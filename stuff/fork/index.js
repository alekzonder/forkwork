var Manager = require(__dirname + '/../../src/Manager');

var log4js = require('log4js');

if (process.env.l) {
    log4js.setGlobalLogLevel(process.env.l);
}

process.on('unhandledRejection', (error) => {
    logger.fatal(error);
});

// var config = {
//     appenders: [{
//         type: "console",
//         layout: {
//             type: "pattern",
//             pattern: "%[%p {%x{ln}} -%]\t%m",
//             tokens: {
//                 ln: function() {
//
//                     var stack = (new Error).stack.split('\n');
//
//                     // console.log(stack);
//
//                     var lastLine = stack[stack.length - 1];
//
//                     return lastLine
//                         // Just the namespace, filename, line:
//                         .replace(/^\s+at\s+(\S+)\s\((.+?)([^\/]+):(\d+):\d+\)$/, function() {
//                             return arguments[1] + ' ' + arguments[2] + arguments[3] + ' line ' + arguments[4];
//                             // return arguments[0] +' '+ arguments[2] +' line '+arguments[3]
//                         });
//                 }
//             }
//         }
//     }],
//     levels: {
//         '[all]': 'INFO'
//     }
// };

log4js.configure(config);

var logger = log4js.getLogger('main');

var config = {
    forkCount: 5,
    worker: {
        path: './work',
        startupTimeout: 1000
    },
    cwd: __dirname
};


var manager = new Manager(log4js, config);

manager.onError((error) => {
    logger.error(error.message);
});

manager.onFatal((error) => {
    logger.fatal(error.message);

    logger.info('shutdown all forks');

    manager.shutdown()
        .then(() => {
            process.exit(1);
        }).catch((error) => {
            logger.error(error);
            process.exit(1);
        });

});

manager.onClose((code, worker) => {
    logger.trace(`worker ${worker.id} closed with code = ${code}`);
});

manager.up()
    .then((workersCount) => {

        logger.info(`${workersCount} workers online`);

        var start = (new Date()).getTime();

        var started = 0;
        var done = 0;

        manager.tasks.onTaskStarted((id) => {
            started++;
        });

        manager.tasks.onTaskFinished((id) => {
            logger.info(`task ${id} done`);
            done++;

            if (started && started == done && manager.tasks.getQueueSize() === 0) {

                var doneDate = (new Date).getTime();

                console.log(doneDate - start);

                console.log(manager.workers.getWorkersStat());

                manager.shutdown()
                    .then(() => {
                        logger.info('success shutdown');
                    })
                    .catch((error) => {
                        logger.fatal(error);
                        process.exit(1);
                    });
            }
        });

        manager.tasks.onTaskError((error) => {

            logger.error(error);

            manager.shutdown()
                .then(() => {
                    logger.fatal('shutdown on error', error.message);
                    process.exit(1);
                })
                .catch((error) => {
                    logger.fatal(error);
                    process.exit(1);
                });
        });

        manager.tasks.onTaskFatal((error) => {
            logger.fatal(error);
        });

        for (var i = 0; i < 10; i++) {
            var task = manager.tasks.add({type: 'echo', text: i});
        }

    })
    .catch((error) => {
        logger.fatal(error.message);
        logger.debug(error);
        process.exit(1);
    });
