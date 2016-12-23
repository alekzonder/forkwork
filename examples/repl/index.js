// var manager; require('./index')().then(m => manager = m).catch(e => console.log(e));
//
//
//
var log4js = require('log4js');
log4js.setGlobalLogLevel('INFO');
var logger = log4js.getLogger('intro');

var Manager = require(__dirname + '/../../src/Manager');


module.exports = function () {

    return new Promise((resolve/*, reject*/) => {
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
                logger.info(`up ${workersCount} workers`);

                manager.tasks
                    .onTaskFinished((id) => {

                        // got result of task
                        var task = manager.tasks.get(id);

                        var result = task.result;

                        logger.info(`task ${id} finished with result = `, result);
                    });


                // add tasks
                manager.tasks.add({type: 'echo', msg: '1'});
                // manager.tasks.add({type: 'echo', msg: '2'});
                // manager.tasks.add({type: 'echo', msg: '3'});

                resolve(manager);
            })
            .catch((error) => {
                logger.fatal(error);
                process.exit(1);
            });

    });

};
