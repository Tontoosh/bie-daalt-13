'use strict';

require('dotenv').config();
const { initSchema, closePool } = require('../database');
const logger = require('../../utils/logger');

(async () => {
  try {
    await initSchema();
    logger.info('Migration 001: schema created successfully');
  } catch (err) {
    logger.error('Migration 001 failed', { message: err.message });
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();
