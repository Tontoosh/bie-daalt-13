'use strict';

require('dotenv').config();
const express = require('express');
const { initSchema, closePool } = require('./db/database');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use('/api/tasks',  require('./routes/taskRoutes'));
app.use('/api/labels', require('./routes/labelRoutes'));
app.use('/api/users',  require('./routes/userRoutes'));

app.use(errorHandler);

async function start() {
  await initSchema();
  const server = app.listen(config.app.port, () => {
    logger.info(`Server listening on port ${config.app.port}`);
  });
  return server;
}

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  });
}

module.exports = app;
