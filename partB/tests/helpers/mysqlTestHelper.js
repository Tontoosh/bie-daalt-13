'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.test') });
const { initSchema, getPool, closePool } = require('../../src/db/database');

async function setupTestDb() {
  await initSchema();
}

async function teardownTestDb() {
  const pool = getPool();
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute('TRUNCATE TABLE task_labels');
  await pool.execute('TRUNCATE TABLE tasks');
  await pool.execute('TRUNCATE TABLE labels');
  await pool.execute('TRUNCATE TABLE users');
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}

async function closeTestDb() {
  await closePool();
}

module.exports = { setupTestDb, teardownTestDb, closeTestDb };
