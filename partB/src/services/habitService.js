'use strict';

const { getPool } = require('../db/database');

async function getHabits(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM habits WHERE user_id = ? AND is_archived = 0 ORDER BY created_at', [userId]
  );
  return rows;
}

async function getHabitById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM habits WHERE id = ?', [id]);
  if (!row) { const e = new Error('Habit not found'); e.status = 404; throw e; }
  return row;
}

async function createHabit({ userId, name, description, color, icon, frequency, targetCount } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO habits (user_id, name, description, color, icon, frequency, target_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, name, description ?? null, color ?? '#6366f1', icon ?? null, frequency ?? 'daily', targetCount ?? 1]
  );
  return getHabitById(result.insertId);
}

async function updateHabit(id, { name, description, color, frequency, targetCount, isArchived }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (name        !== undefined) { fields.push('name = ?');         params.push(name); }
  if (description !== undefined) { fields.push('description = ?');  params.push(description ?? null); }
  if (color       !== undefined) { fields.push('color = ?');        params.push(color); }
  if (frequency   !== undefined) { fields.push('frequency = ?');    params.push(frequency); }
  if (targetCount !== undefined) { fields.push('target_count = ?'); params.push(targetCount); }
  if (isArchived  !== undefined) { fields.push('is_archived = ?');  params.push(isArchived ? 1 : 0); }
  if (!fields.length) return getHabitById(id);
  params.push(id);
  await pool.execute(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, params);
  return getHabitById(id);
}

async function deleteHabit(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM habits WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Habit not found'); e.status = 404; throw e; }
}

async function logHabit(habitId, userId, loggedOn, { count, note } = {}) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO habit_logs (habit_id, user_id, logged_on, count, note) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE count = VALUES(count), note = VALUES(note)`,
    [habitId, userId, loggedOn, count ?? 1, note ?? null]
  );
  const [[row]] = await pool.execute(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND logged_on = ?', [habitId, loggedOn]
  );
  return row;
}

async function getLogs(habitId, { from, to } = {}) {
  const pool = getPool();
  let sql = 'SELECT * FROM habit_logs WHERE habit_id = ?';
  const params = [habitId];
  if (from) { sql += ' AND logged_on >= ?'; params.push(from); }
  if (to)   { sql += ' AND logged_on <= ?'; params.push(to); }
  sql += ' ORDER BY logged_on DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getStreak(habitId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT logged_on FROM habit_logs WHERE habit_id = ? ORDER BY logged_on DESC LIMIT 365', [habitId]
  );
  let streak = 0;
  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const actual = new Date(rows[i].logged_on).toISOString().slice(0, 10);
    if (actual === expected) streak++;
    else break;
  }
  return streak;
}

module.exports = { getHabits, getHabitById, createHabit, updateHabit, deleteHabit, logHabit, getLogs, getStreak };
