// middleware/errorHandler.js
const config = require('../config');

function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  
  if (config.nodeEnv !== 'production') {
    console.error(`[Error] ${req.method} ${req.url}`, err.message);
  }

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
