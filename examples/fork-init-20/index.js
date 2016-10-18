var log4js = require('log4js');
log4js.setGlobalLogLevel('INFO');
var logger = log4js.getLogger('intro');

var Manager = require(__dirname + '/../../src/Manager');


// fork manager config
var config = {
    forkCount: 20,
    worker: {
        path: __dirname + '/worker',
    },
    cwd: __dirname
};


// create Manager object
var manager = new Manager(log4js, config);

console.time('init');

// bind error and fatal callbacks for manager
manager
    .up()
    .then((workersCount) => {
        console.timeEnd('init');
        manager.exit();
    })
    .catch((error) => {
        logger.fatal(error);
        process.exit(1);
    });
