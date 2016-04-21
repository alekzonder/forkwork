var logger = require('log4js').getLogger('worker');
var EventEmitter = require('events').EventEmitter;


var Worker = require(__dirname + '/../../src/Worker');


var eventEmitter = new EventEmitter();

var config = {};

var worker = new Worker(logger, config, eventEmitter);

worker.up()
    .then(() => {
        setTimeout(() => {
            worker.online();
        }, 500);

    })
    .catch(() => {

    });
