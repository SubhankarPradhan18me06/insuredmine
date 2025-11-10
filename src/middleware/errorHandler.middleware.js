const { responseLogger } = require('../logger/index.logger');

module.exports = function errorHandlerMiddleware(err, req, res, next) {
  // Normalize status and message
  const status = err && (err.status || err.statusCode) ? err.status || err.statusCode : 500;
  const message = err && err.message ? err.message : 'Internal Server Error';

  // Log error with stack and request context
  try {
    responseLogger.error('Unhandled Error', {
      message,
      status,
      path: req.originalUrl,
      method: req.method,
      query: req.query,
      body: (req.body && Object.keys(req.body).length) ? req.body : undefined,
      stack: err && err.stack ? err.stack.split('\n').slice(0, 10).join('\n') : undefined
    });
  } catch (logErr) {
       console.error('errorHandlerMiddleware logging failed', logErr);
  }

  // Send JSON response (hide stack in production)
  const payload = { error: message };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  res.status(status).json(payload);
};
