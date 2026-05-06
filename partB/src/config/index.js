'use strict';

const config = {
  db: {
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT || '3306', 10),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'task_tracker',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env:  process.env.NODE_ENV || 'development',
  },
};

module.exports = config;
