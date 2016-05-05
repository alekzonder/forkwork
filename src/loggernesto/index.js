var Wrapper = require('./Wrapper');

module.exports = (logger, category) => {
    return new Wrapper(logger, category);
};
