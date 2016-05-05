var Wrapper = require('./Wrapper');

module.exports = (logger, category) => {

    if (logger.iAmLoggernesto) {
        return logger.getLogger(category);
    }

    return new Wrapper(logger, category);
};
