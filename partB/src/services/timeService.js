'use strict';

const { getPool } = require('../db/database');

async function getEntries(userId, { taskId } = {}) {
  const pool = getPool();
  let sql = `SELECT te.*, t.title as task_title
    FROM time_entries te LEFT JOIN tasks t ON t.id = te.task_id
    WHERE te.user_id = ?`;
  const params = [userId];
  if (taskId) { sql += ' AND te.task_id = ?'; params.push(taskId); }
  sql += ' ORDER BY te.started_at DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getEntryById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM time_entries WHERE id = ?', [id]);
  if (!row) { const e = new Error('Time entry not found'); e.status = 404; throw e; }
  return row;
}

async function startTimer(userId, { taskId, description } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO time_entries (user_id, task_id, description, started_at) VALUES (?, ?, ?, NOW())',
    [userId, taskId ?? null, description ?? null]
  );
  return getEntryById(result.insertId);
}

async function stopTimer(id) {
  const pool = getPool();
  await pool.execute('UPDATE time_entries SET ended_at = NOW() WHERE id = ? AND ended_at IS NULL', [id]);
  return getEntryById(id);
}

async function createEntry({ userId, taskId, description, startedAt, endedAt } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO time_entries (user_id, task_id, description, started_at, ended_at) VALUES (?, ?, ?, ?, ?)',
    [userId, taskId ?? null, description ?? null, startedAt, endedAt ?? null]
  );
  return getEntryById(result.insertId);
}

async function deleteEntry(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM time_entries WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Time entry not found'); e.status = 404; throw e; }
}

async function getTotalByTask(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT task_id, t.title, SUM(TIMESTAMPDIFF(SECOND, started_at, IFNULL(ended_at, NOW()))) as total_s
     FROM time_entries te LEFT JOIN tasks t ON t.id = te.task_id
     WHERE te.user_id = ? AND started_at IS NOT NULL
     GROUP BY task_id, t.title ORDER BY total_s DESC`,
    [userId]
  );
  return rows;
}

module.exports = { getEntries, getEntryById, startTimer, stopTimer, createEntry, deleteEntry, getTotalByTask };
