# forkwork

# install

```
npm i --save forkwork
```

# simple usage

3 tasks, 3 workers

## worker.js

```js
var logger = require('log4js').getLogger('worker');
var Worker = require('forkwork/Worker');

var worker = new Worker(logger);

// setup worker
worker.onTask((task) => {
        var echo = `ECHO ${task.data.msg}`;

        console.log(echo);

        // return result
        task.done({status: true, echo: echo});
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

                // got result of task
                var task = manager.tasks.get(id);

                var result = task.result;

                logger.info(`task ${id} finished with result = `, result);

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

# LICENSE

MIT
