'use strict';

const userService = require('../services/userService');

async function register(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'Email or username already taken';
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const user = await userService.verifyPassword(req.body.email, req.body.password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(Number(req.params.id), req.body);
    res.json(user);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'Email or username already taken';
    }
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    res.json(await userService.searchUsers(q));
  } catch (err) { next(err); }
}

module.exports = { register, login, getUser, updateUser, deleteUser, searchUsers };
