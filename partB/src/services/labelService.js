'use strict';

const { getPool } = require('../db/database');

async function getAllLabels() {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM labels ORDER BY name');
  return rows;
}

async function getLabelById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM labels WHERE id = ?', [id]);
  if (!row) {
    const err = new Error('Label not found');
    err.status = 404;
    throw err;
  }
  return row;
}

async function createLabel({ name, color }) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO labels (name, color) VALUES (?, ?)',
    [name, color ?? '#6366f1']
  );
  return getLabelById(result.insertId);
}

async function updateLabel(id, { name, color }) {
  const pool = getPool();
  const fields = [];
  const params = [];

  if (name  !== undefined) { fields.push('name = ?');  params.push(name); }
  if (color !== undefined) { fields.push('color = ?'); params.push(color); }

  if (fields.length === 0) return getLabelById(id);

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE labels SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (result.affectedRows === 0) {
    const err = new Error('Label not found');
    err.status = 404;
    throw err;
  }
  return getLabelById(id);
}

async function deleteLabel(id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM labels WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const err = new Error('Label not found');
    err.status = 404;
    throw err;
  }
}

module.exports = { getAllLabels, getLabelById, createLabel, updateLabel, deleteLabel };
