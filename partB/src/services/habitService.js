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

async function logHabit(habitId, userId, loggedOn, { note } = {}) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO habit_logs (habit_id, user_id, logged_on, count, note) VALUES (?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE count = count + 1, note = COALESCE(VALUES(note), note)`,
    [habitId, userId, loggedOn, note ?? null]
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
  const habit = await getHabitById(habitId);
  const { frequency } = habit;

  const today = new Date().toISOString().slice(0, 10);

  const [[todayLog]] = await pool.execute(
    'SELECT count FROM habit_logs WHERE habit_id = ? AND logged_on = ?',
    [habitId, today]
  );
  const todayCount = todayLog?.count ?? 0;

  const [rows] = await pool.execute(
    'SELECT logged_on FROM habit_logs WHERE habit_id = ? ORDER BY logged_on DESC LIMIT 400',
    [habitId]
  );
  const logSet = new Set(rows.map(r => new Date(r.logged_on).toISOString().slice(0, 10)));

  let streak = 0;

  if (frequency === 'daily') {
    // If today logged start from today, otherwise start from yesterday
    const start = logSet.has(today) ? 0 : 1;
    for (let i = start; ; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (logSet.has(d)) streak++;
      else break;
    }

  } else if (frequency === 'weekly') {
    // Rolling 7-day windows: week 0 = last 7 days, week 1 = 7–14 days ago, …
    for (let w = 0; w < 52; w++) {
      let hasLog = false;
      for (let d = w * 7; d < (w + 1) * 7; d++) {
        const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
        if (logSet.has(date)) { hasLog = true; break; }
      }
      if (hasLog) streak++;
      else break;
    }

  } else if (frequency === 'monthly') {
    const now = new Date();
    for (let m = 0; m < 24; m++) {
      const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const yr = target.getFullYear();
      const mo = target.getMonth();
      const days = new Date(yr, mo + 1, 0).getDate();
      let hasLog = false;
      for (let d = 1; d <= days; d++) {
        const date = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (logSet.has(date)) { hasLog = true; break; }
      }
      if (hasLog) streak++;
      else break;
    }
  }

  return { streak, todayCount, frequency };
}

module.exports = { getHabits, getHabitById, createHabit, updateHabit, deleteHabit, logHabit, getLogs, getStreak };
