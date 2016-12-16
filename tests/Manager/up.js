var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

var _ = require('lodash');

chai.use(chaiAsPromised);

chai.should();

var Manager = require('../../src/Manager');

var getMock = function (mock) {
    return require('../mocks/' + mock);
};

describe('Manager', function () {

    describe('validate logger interface', function () {

        var loggerBase = getMock('logger');

        var loggerMethods = ['trace', 'debug', 'info', 'error', 'fatal'];

        _.each(loggerMethods, (method) => {

            it('should error on invalid logger object. without method ' + method, function () {

                var loggerClone = _.cloneDeep(loggerBase);

                delete loggerClone[method];

                var log4js = {
                    getLogger: function () {
                        return loggerClone;
                    }
                };

                var manager = new Manager(log4js, {});

                return Promise.all([
                    manager.up().should.be.rejectedWith(Error, 'logger must have method ' + method),
                ]);

            });

        });

        _.each(loggerMethods, (method) => {

            it('should error on invalid logger object. method ' + method + ' not a function', function () {

                var loggerClone = _.cloneDeep(loggerBase);

                loggerClone[method] = method;

                var log4js = {
                    getLogger: function () {
                        return loggerClone;
                    }
                };

                var manager = new Manager(log4js, {});

                return Promise.all([
                    manager.up().should.be.rejectedWith(Error, 'logger must have method ' + method),
                ]);

            });

        });

    });

    describe('up', function () {

        it('should error on empty config', function () {

            var config = {};

            var manager = new Manager({}, config);

            return Promise.all([
                manager.up().should.be.rejected,
                manager.up().should.be.rejectedWith(Error)
            ]);

        });

        it('should error on invalid worker path', function () {

            var config = {
                forksCount: 2,
                worker: {
                    path: './unknownScript'
                },
                cwd: process.cwd()
            };

            var loggerBase = getMock('logger');

            var log4js = {
                getLogger: function () {
                    return loggerBase;
                }
            };

            var manager = new Manager(log4js, config);

            return Promise.all([
                manager.up().should.be.rejected,
                manager.up().should.be.rejectedWith(Error, 'test')
            ]);

        });
    });

});