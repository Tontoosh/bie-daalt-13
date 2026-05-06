'use strict';

const { getPool } = require('../db/database');

async function getGoals(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId]
  );
  return rows;
}

async function getGoalById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM goals WHERE id = ?', [id]);
  if (!row) { const e = new Error('Goal not found'); e.status = 404; throw e; }
  return row;
}

async function createGoal({ userId, title, description, targetDate } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)',
    [userId, title, description ?? null, targetDate ?? null]
  );
  return getGoalById(result.insertId);
}

async function updateGoal(id, { title, description, status, targetDate, progress }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (title       !== undefined) { fields.push('title = ?');       params.push(title); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description ?? null); }
  if (status      !== undefined) { fields.push('status = ?');      params.push(status); }
  if (targetDate  !== undefined) { fields.push('target_date = ?'); params.push(targetDate ?? null); }
  if (progress    !== undefined) { fields.push('progress = ?');    params.push(Math.min(100, Math.max(0, progress))); }
  if (!fields.length) return getGoalById(id);
  params.push(id);
  await pool.execute(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, params);
  return getGoalById(id);
}

async function deleteGoal(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM goals WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Goal not found'); e.status = 404; throw e; }
}

async function getMilestones(goalId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY position, created_at', [goalId]
  );
  return rows;
}

async function addMilestone(goalId, { title, dueDate, position } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO goal_milestones (goal_id, title, due_date, position) VALUES (?, ?, ?, ?)',
    [goalId, title, dueDate ?? null, position ?? 0]
  );
  const [[row]] = await pool.execute('SELECT * FROM goal_milestones WHERE id = ?', [result.insertId]);
  return row;
}

async function updateMilestone(id, { isDone, title }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (isDone !== undefined) { fields.push('is_done = ?'); params.push(isDone ? 1 : 0); }
  if (title  !== undefined) { fields.push('title = ?');  params.push(title); }
  if (!fields.length) return;
  params.push(id);
  await pool.execute(`UPDATE goal_milestones SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function deleteMilestone(id) {
  const pool = getPool();
  await pool.execute('DELETE FROM goal_milestones WHERE id = ?', [id]);
}

module.exports = { getGoals, getGoalById, createGoal, updateGoal, deleteGoal, getMilestones, addMilestone, updateMilestone, deleteMilestone };
