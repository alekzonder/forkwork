var log4js = require('log4js');
log4js.setGlobalLogLevel('INFO');
var logger = log4js.getLogger('intro');

var Manager = require(__dirname + '/../../src/Manager');


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
    .up()
    .then((workersCount) => {
        var done = 0;

        manager.tasks
            .onTaskFinished((id) => {
                done++;

                if (done === 3) {
                    manager.exit();
                }
            });


        // add tasks
        manager.tasks.add({type: 'echo', msg: '1'});
        manager.tasks.add({type: 'echo', msg: '2'});
        manager.tasks.add({type: 'echo', msg: '3'});
    })
    .catch((error) => {
        logger.fatal(error);
        process.exit(1);
    });
