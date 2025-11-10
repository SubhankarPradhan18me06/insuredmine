const notFound = require('./notFound.middleware');
const errorHandler = require('./errorHandler.middleware');
let security;
try {
  security = require('./security.middleware')();
} catch {
  security = (req, res, next) => next();
}

module.exports = {
  notFound,
  errorHandler,
  security
};
