module.exports = function securityMiddleware() {
  try {
    const helmet = require('helmet');
    return helmet();
  } catch (e) {
   
    return function minimalSecurityHeaders(req, res, next) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    };
  }
};
