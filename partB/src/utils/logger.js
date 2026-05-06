'use strict';

const config = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.app.env === 'production' ? LEVELS.warn : LEVELS.debug;

function log(level, message, meta = {}) {
  if (LEVELS[level] > currentLevel) return;
  const entry = JSON.stringify({ level, message, ...meta, ts: new Date().toISOString() });
  if (level === 'error') process.stderr.write(entry + '\n');
  else process.stdout.write(entry + '\n');
}

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = logger;
