'use strict';

const { getPool } = require('../db/database');

function monthRange(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return {};
  const start = `${month}-01 00:00:00`;
  const endDate = new Date(`${month}-01T00:00:00Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-01 00:00:00`;
  return { start, end };
}

async function getEntries(userId, { taskId, goalId, habitId, itemType, month } = {}) {
  const pool = getPool();
  let sql = `SELECT te.*, t.title as task_title, g.title as goal_title, h.name as habit_name,
      CASE
        WHEN te.task_id IS NOT NULL THEN 'task'
        WHEN te.goal_id IS NOT NULL THEN 'goal'
        WHEN te.habit_id IS NOT NULL THEN 'habit'
        ELSE 'general'
      END AS item_type,
      COALESCE(t.title, g.title, h.name, 'General') AS item_name,
      TIMESTAMPDIFF(SECOND, te.started_at, IFNULL(te.ended_at, NOW())) AS tracked_s
    FROM time_entries te
    LEFT JOIN tasks t ON t.id = te.task_id
    LEFT JOIN goals g ON g.id = te.goal_id
    LEFT JOIN habits h ON h.id = te.habit_id
    WHERE te.user_id = ?`;
  const params = [userId];
  if (taskId) { sql += ' AND te.task_id = ?'; params.push(taskId); }
  if (goalId) { sql += ' AND te.goal_id = ?'; params.push(goalId); }
  if (habitId) { sql += ' AND te.habit_id = ?'; params.push(habitId); }
  if (itemType === 'task') sql += ' AND te.task_id IS NOT NULL';
  if (itemType === 'goal') sql += ' AND te.goal_id IS NOT NULL';
  if (itemType === 'habit') sql += ' AND te.habit_id IS NOT NULL';
  const { start, end } = monthRange(month);
  if (start && end) { sql += ' AND te.started_at >= ? AND te.started_at < ?'; params.push(start, end); }
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

function targetIds({ itemType, taskId, goalId, habitId } = {}) {
  return {
    taskId: itemType === 'task' ? taskId : null,
    goalId: itemType === 'goal' ? goalId : null,
    habitId: itemType === 'habit' ? habitId : null,
  };
}

async function startTimer(userId, { itemType, taskId, goalId, habitId, description } = {}) {
  const pool = getPool();
  const target = targetIds({ itemType, taskId, goalId, habitId });
  const [result] = await pool.execute(
    'INSERT INTO time_entries (user_id, task_id, goal_id, habit_id, description, started_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, target.taskId ?? null, target.goalId ?? null, target.habitId ?? null, description ?? null]
  );
  return getEntryById(result.insertId);
}

async function stopTimer(id) {
  const pool = getPool();
  await pool.execute('UPDATE time_entries SET ended_at = NOW() WHERE id = ? AND ended_at IS NULL', [id]);
  return getEntryById(id);
}

async function createEntry({ userId, itemType, taskId, goalId, habitId, description, startedAt, endedAt } = {}) {
  const pool = getPool();
  const target = targetIds({ itemType, taskId, goalId, habitId });
  const [result] = await pool.execute(
    'INSERT INTO time_entries (user_id, task_id, goal_id, habit_id, description, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, target.taskId ?? null, target.goalId ?? null, target.habitId ?? null, description ?? null, startedAt, endedAt ?? null]
  );
  return getEntryById(result.insertId);
}

async function deleteEntry(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM time_entries WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Time entry not found'); e.status = 404; throw e; }
}

async function getTotals(userId, { month } = {}) {
  const pool = getPool();
  let where = 'WHERE te.user_id = ? AND te.started_at IS NOT NULL';
  const params = [userId];
  const { start, end } = monthRange(month);
  if (start && end) { where += ' AND te.started_at >= ? AND te.started_at < ?'; params.push(start, end); }
  const [rows] = await pool.execute(
    `SELECT
       CASE
         WHEN te.task_id IS NOT NULL THEN 'task'
         WHEN te.goal_id IS NOT NULL THEN 'goal'
         WHEN te.habit_id IS NOT NULL THEN 'habit'
         ELSE 'general'
       END AS item_type,
       COALESCE(t.title, g.title, h.name, 'General') AS item_name,
       SUM(TIMESTAMPDIFF(SECOND, te.started_at, IFNULL(te.ended_at, NOW()))) as total_s,
       COUNT(*) as entry_count
     FROM time_entries te
     LEFT JOIN tasks t ON t.id = te.task_id
     LEFT JOIN goals g ON g.id = te.goal_id
     LEFT JOIN habits h ON h.id = te.habit_id
     ${where}
     GROUP BY item_type, item_name
     ORDER BY total_s DESC`,
    params
  );
  return rows;
}

module.exports = { getEntries, getEntryById, startTimer, stopTimer, createEntry, deleteEntry, getTotals };
