var log4js = require('log4js');
var logger = log4js.getLogger('worker');

log4js.setGlobalLogLevel('INFO');

var Worker = require(__dirname + '/../../src/Worker');

// create worker object
var worker = new Worker(logger, {});

// setup worker
worker
    .onTask((task) => {
        var echo = `ECHO ${task.data.msg}`;

        console.log(echo);

        // return result
        task.done({status: true, echo: echo});
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

