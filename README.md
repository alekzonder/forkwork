# forkwork

# install

```
npm i --save forkwork
```

# simple usage

3 tasks, 3 workers

## manager.js

```js
var log4js = require('log4js');
var Manager = require('forkwork/Manager');

var config = {
    forkCount: 3,
    worker: {
        path: __dirname + '/worker',
    },
    cwd: __dirname
};

var manager = new Manager(log4js, config);

manager.up()
    .then(() => {
        var done = 0;

        manager.tasks
            .onTaskFinished((id) => {
                done++;

                if (done == 3) {
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
        manager.exit(1);
    });

```


## worker.js

```js
var logger = require('log4js').getLogger('worker');
var Worker = require('forkwork/Worker');

var worker = new Worker(logger);

// setup worker
worker.onTask((task) => {
        console.log(`ECHO ${task.data.msg}`);
        task.done();
    });

worker.up()
    .then(() => {
        worker.online();
    })
    .catch((error) => {
        logger.error(error);
        process.exit(1);
    });
```