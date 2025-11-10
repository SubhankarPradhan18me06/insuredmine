const { requestLogger } = require('../logger/index.logger');

function requestLoggerMiddleware(req, res, next) {
  // Log incoming request metadata (avoid logging sensitive data in prod)
  requestLogger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers && {
      'user-agent': req.headers['user-agent'],
      host: req.headers.host
    },
    body: req.method === 'GET' ? undefined : req.body
  });
  next();
}

module.exports = requestLoggerMiddleware;
