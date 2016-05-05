var Manager = require(__dirname + '/../../src/Manager');

var log4js = require('log4js');

var config = {
    appenders: [
        {
            type: 'console'
        }
    ],
    levels: {
        '[all]': 'TRACE'
    }
};

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

log4js.getLogger('test').trace('trace');

var logger = log4js.getLogger('main');

var config = {
    forkCount: 3,
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
    .then((result) => {

        logger.info(`${result.length} workers online`);

        setTimeout(() => {

            logger.info('send "shutdown" to workers');

            manager.shutdown()
                .then(() => {
                    logger.info('shutdown');
                })
                .catch((error) => {
                    logger.error(error);
                    process.exit(1);
                });

        }, 3000);

    })
    .catch((error) => {
        logger.fatal(error.message);
        logger.debug(error);
        process.exit(1);
    });
