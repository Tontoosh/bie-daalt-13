'use strict';

const { getPool } = require('../db/database');

async function getSettings(userId) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
  if (!row) {
    await pool.execute('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [userId]);
    const [[fresh]] = await pool.execute('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    return fresh;
  }
  return row;
}

async function updateSettings(userId, { theme, language, timezone, weekStartsOn, notificationsEnabled }) {
  const pool = getPool();
  await pool.execute('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [userId]);
  const fields = []; const params = [];
  if (theme                  !== undefined) { fields.push('theme = ?');                  params.push(theme); }
  if (language               !== undefined) { fields.push('language = ?');               params.push(language); }
  if (timezone               !== undefined) { fields.push('timezone = ?');               params.push(timezone); }
  if (weekStartsOn           !== undefined) { fields.push('week_starts_on = ?');         params.push(weekStartsOn); }
  if (notificationsEnabled   !== undefined) { fields.push('notifications_enabled = ?'); params.push(notificationsEnabled ? 1 : 0); }
  if (!fields.length) return getSettings(userId);
  params.push(userId);
  await pool.execute(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`, params);
  return getSettings(userId);
}

module.exports = { getSettings, updateSettings };
