'use strict';

const { getPool } = require('../db/database');

async function getNotifications(userId, { unreadOnly } = {}) {
  const pool = getPool();
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];
  if (unreadOnly) { sql += ' AND is_read = 0'; }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function createNotification({ userId, type, title, body, refType, refId } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, type, title, body, ref_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, type, title, body ?? null, refType ?? null, refId ?? null]
  );
  const [[row]] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return row;
}

async function markRead(id) {
  const pool = getPool();
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  const [[row]] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
  return row;
}

async function markAllRead(userId) {
  const pool = getPool();
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

async function deleteNotification(id) {
  const pool = getPool();
  await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
}

async function getUnreadCount(userId) {
  const pool = getPool();
  const [[row]] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]
  );
  return row.count;
}

module.exports = { getNotifications, createNotification, markRead, markAllRead, deleteNotification, getUnreadCount };
