'use strict';

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error('Server error', { status, message: err.message, stack: err.stack });
  }
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
