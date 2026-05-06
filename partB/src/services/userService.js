'use strict';

const bcrypt = require('bcrypt');
const { getPool } = require('../db/database');

const SALT_ROUNDS = 10;

async function getUserById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute(
    'SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  if (!row) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return row;
}

async function getUserByEmail(email) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return row ?? null;
}

async function createUser({ email, username, password }) {
  const pool = getPool();
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.execute(
    'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
    [email, username, password_hash]
  );
  return getUserById(result.insertId);
}

async function verifyPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;
  const { password_hash: _, ...safe } = user;
  return safe;
}

async function updateUser(id, { email, username }) {
  const pool = getPool();
  const fields = [];
  const params = [];

  if (email    !== undefined) { fields.push('email = ?');    params.push(email); }
  if (username !== undefined) { fields.push('username = ?'); params.push(username); }

  if (fields.length === 0) return getUserById(id);

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (result.affectedRows === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return getUserById(id);
}

async function deleteUser(id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
}

module.exports = { getUserById, getUserByEmail, createUser, verifyPassword, updateUser, deleteUser };
