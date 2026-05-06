'use strict';

const VALID_STATUS   = new Set(['todo', 'in-progress', 'in-review', 'done', 'cancelled']);
const VALID_PRIORITY = new Set(['low', 'medium', 'high', 'urgent']);

function validateTask(req, res, next) {
  const { title, status, priority } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  if (status   && !VALID_STATUS.has(status)) {
    return res.status(400).json({ error: `status must be one of: ${[...VALID_STATUS].join(', ')}` });
  }
  if (priority && !VALID_PRIORITY.has(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${[...VALID_PRIORITY].join(', ')}` });
  }
  next();
}

function validateLabel(req, res, next) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  next();
}

function validateLabelAssign(req, res, next) {
  const { label_id } = req.body;
  if (!label_id || !Number.isInteger(Number(label_id))) {
    return res.status(400).json({ error: 'label_id is required' });
  }
  next();
}

function validateUser(req, res, next) {
  const { email, username, password } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'username is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  next();
}

module.exports = { validateTask, validateLabel, validateLabelAssign, validateUser, validateLogin };
