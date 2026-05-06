'use strict';

const { getPool } = require('../db/database');

async function getEvents(userId, { from, to } = {}) {
  const pool = getPool();
  let sql = 'SELECT * FROM calendar_events WHERE user_id = ?';
  const params = [userId];
  if (from) { sql += ' AND end_at >= ?';   params.push(from); }
  if (to)   { sql += ' AND start_at <= ?'; params.push(to); }
  sql += ' ORDER BY start_at';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getEventById(id) {
  const pool = getPool();
  const [[row]] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [id]);
  if (!row) { const e = new Error('Event not found'); e.status = 404; throw e; }
  return row;
}

async function createEvent({ userId, title, description, startAt, endAt, isAllDay, location, color, recurrenceRule } = {}) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO calendar_events (user_id, title, description, start_at, end_at, is_all_day, location, color, recurrence_rule)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId ?? null, title, description ?? null, startAt, endAt,
     isAllDay ? 1 : 0, location ?? null, color ?? '#6366f1', recurrenceRule ?? null]
  );
  return getEventById(result.insertId);
}

async function updateEvent(id, { title, description, startAt, endAt, isAllDay, location, color, isCancelled }) {
  const pool = getPool();
  const fields = []; const params = [];
  if (title       !== undefined) { fields.push('title = ?');        params.push(title); }
  if (description !== undefined) { fields.push('description = ?');  params.push(description ?? null); }
  if (startAt     !== undefined) { fields.push('start_at = ?');     params.push(startAt); }
  if (endAt       !== undefined) { fields.push('end_at = ?');       params.push(endAt); }
  if (isAllDay    !== undefined) { fields.push('is_all_day = ?');   params.push(isAllDay ? 1 : 0); }
  if (location    !== undefined) { fields.push('location = ?');     params.push(location ?? null); }
  if (color       !== undefined) { fields.push('color = ?');        params.push(color); }
  if (isCancelled !== undefined) { fields.push('is_cancelled = ?'); params.push(isCancelled ? 1 : 0); }
  if (!fields.length) return getEventById(id);
  params.push(id);
  await pool.execute(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`, params);
  return getEventById(id);
}

async function deleteEvent(id) {
  const pool = getPool();
  const [r] = await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);
  if (!r.affectedRows) { const e = new Error('Event not found'); e.status = 404; throw e; }
}

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
