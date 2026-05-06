'use strict';

const { getPool } = require('../db/database');

async function getProjects(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT p.* FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
     WHERE p.owner_id = ? OR pm.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId, userId, userId]
  );
  return rows;
}

async function getProjectById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM projects WHERE id = ?', [id]);
  if (!row) { const e = new Error('Project not found'); e.status = 404; throw e; }
  return row;
}

async function createProject({ ownerId, name, description, color } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO projects (owner_id, name, description, color) VALUES (?, ?, ?, ?)',
    [ownerId ?? null, name, description ?? null, color ?? '#6366f1']
  );
  return getProjectById(result.insertId);
}

async function updateProject(id, { name, description, color, isArchived }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (name        !== undefined) { fields.push('name = ?');        params.push(name); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description ?? null); }
  if (color       !== undefined) { fields.push('color = ?');       params.push(color); }
  if (isArchived  !== undefined) { fields.push('is_archived = ?'); params.push(isArchived ? 1 : 0); }
  if (!fields.length) return getProjectById(id);
  params.push(id);
  await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
  return getProjectById(id);
}

async function deleteProject(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Project not found'); e.status = 404; throw e; }
}

async function getMembers(projectId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.email, pm.role, pm.joined_at
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?`,
    [projectId]
  );
  return rows;
}

async function addMember(projectId, userId, role) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [projectId, userId, role ?? 'viewer']
  );
}

async function removeMember(projectId, userId) {
  const pool = getPool();
  await pool.execute('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
}

async function getProjectTasks(projectId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT t.*, u.username as assignee_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = ?
     ORDER BY t.priority DESC, t.due_date ASC`,
    [projectId]
  );
  return rows;
}

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, getMembers, addMember, removeMember, getProjectTasks };
