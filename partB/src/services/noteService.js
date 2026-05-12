'use strict';

const { getPool } = require('../db/database');

async function getAllNotes(userId, { search, archived } = {}) {
  const pool = getPool();
  let sql = 'SELECT * FROM notes WHERE user_id = ?';
  const params = [userId];
  if (search) { sql += ' AND MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)'; params.push(search); }
  if (archived !== undefined) { sql += ' AND is_archived = ?'; params.push(Number(archived) ? 1 : 0); }
  sql += ' ORDER BY is_pinned DESC, updated_at DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getNoteById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM notes WHERE id = ?', [id]);
  if (!row) { const e = new Error('Note not found'); e.status = 404; throw e; }
  return row;
}

async function createNote({ userId, projectId, title, body, isPinned } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO notes (user_id, project_id, title, body, is_pinned) VALUES (?, ?, ?, ?, ?)',
    [userId ?? null, projectId ?? null, title, body ?? null, isPinned ? 1 : 0]
  );
  return getNoteById(result.insertId);
}

async function updateNote(id, { title, body, isPinned, isArchived }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (title     !== undefined) { fields.push('title = ?');       params.push(title); }
  if (body      !== undefined) { fields.push('body = ?');        params.push(body ?? null); }
  if (isPinned  !== undefined) { fields.push('is_pinned = ?');   params.push(isPinned ? 1 : 0); }
  if (isArchived!== undefined) { fields.push('is_archived = ?'); params.push(isArchived ? 1 : 0); }
  if (!fields.length) return getNoteById(id);
  params.push(id);
  await pool.execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, params);
  return getNoteById(id);
}

async function deleteNote(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Note not found'); e.status = 404; throw e; }
}

module.exports = { getAllNotes, getNoteById, createNote, updateNote, deleteNote };
