# forkwork

# usage

## manager.js

```js
var log4js = require('log4js');

var ForkManager = require('forkwork/Manager');

var logger = log4js.getLogger();

var config = {
    forkCount: 3,
    worker: {
        path: "./worker"
    },
    cwd: process.cwd()
};

var manager = new ForkManager(logger, config);

var calcSums = [[1,2], [3,5], [6,4], [9,9]];

manager.up()
	then(() => {	
		// 3 workers started
		
		var tasks = manager.tasks;
		
		tasks.onDone((task) => {
			logger.debug(`task ${task.id} done`);
			logger.debug(`task ${task.id} result: ${task.result}`);
		});
		
		tasks.onError((task) => {
			logger.error(`task id=${id} failed with error: ${task.error.message}`);
		});
		
		for (var i=0; i <= calcSums.length; i++) {
			var sum = calcSums[i];
			
			var task = manager.task(sum);
			
			logger.debug(`starting task with data ${task.sum}`);
			
			task.run();
		}
		
	})
	.catch((error) => {
		logger.fatal(error);
		process.exit(1);
	});


```

## worker.js
```js
var log4js = require('log4js');

var ForkWorker = require('forkwork/Worker');

var logger = log4js.getLogger();

var worker = new ForkWorker(logger);

worker.up()
	.then((id) => {
	
		// listen for task
		worker.onTask((task) => {
			if (task.data.length == 2) {	
				task.done(task.data.a + task.data.b);
			} else {
				task.fatal(`invalid task data`);
			}
		});
	
		worker.online();
	
	})
	.catch((error) => {
		logger.fatal(error);
		process.exit(1);
	});
```



# API

## ForkManager

manage workers

### up(): Promise

### close(): Promise

### tasks(): Tasks


create task object

## Task

### onDone(callback)

### onError(callback)

## Tasks

Tasks pool

### add()

## ForkWorker


