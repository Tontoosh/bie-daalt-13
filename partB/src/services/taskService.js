'use strict';

const { getPool } = require('../db/database');

async function getAllTasks({ status, priority, search } = {}) {
  const pool = getPool();
  let sql = `SELECT t.*, u.username as assignee_name
             FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
             WHERE 1=1`;
  const params = [];

  if (status)   { sql += ' AND t.status = ?';   params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  if (search)   { sql += ' AND t.title LIKE ?'; params.push(`%${search}%`); }

  sql += ' ORDER BY t.created_at DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getTaskById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!row) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }
  return row;
}

async function createTask({ title, description, status, priority, due_date, assignee_id, project_id, created_by } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO tasks (title, description, status, priority, due_date, assignee_id, project_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description ?? null, status ?? 'todo', priority ?? 'medium', due_date ?? null,
     assignee_id ?? null, project_id ?? null, created_by ?? null]
  );
  return getTaskById(result.insertId);
}

async function updateTask(id, { title, description, status, priority, due_date }) {
  const pool = getPool();
  const fields = [];
  const params = [];

  if (title       !== undefined) { fields.push('title = ?');       params.push(title); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description ?? null); }
  if (status      !== undefined) { fields.push('status = ?');      params.push(status); }
  if (priority    !== undefined) { fields.push('priority = ?');    params.push(priority); }
  if (due_date    !== undefined) { fields.push('due_date = ?');    params.push(due_date ?? null); }

  if (fields.length === 0) return getTaskById(id);

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (result.affectedRows === 0) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }
  return getTaskById(id);
}

async function deleteTask(id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }
}

async function assignLabel(taskId, labelId) {
  const pool = getPool();
  await pool.execute(
    'INSERT IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)',
    [taskId, labelId]
  );
}

async function removeLabel(taskId, labelId) {
  const pool = getPool();
  await pool.execute(
    'DELETE FROM task_labels WHERE task_id = ? AND label_id = ?',
    [taskId, labelId]
  );
}

async function getTaskLabels(taskId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT l.* FROM labels l
     JOIN task_labels tl ON tl.label_id = l.id
     WHERE tl.task_id = ?`,
    [taskId]
  );
  return rows;
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, assignLabel, removeLabel, getTaskLabels };
