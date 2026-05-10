'use strict';

const taskService = require('../services/taskService');

async function listTasks(req, res, next) {
  try {
    const { status, priority, search } = req.query;
    const tasks = await taskService.getAllTasks({ status, priority, search });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(Number(req.params.id));
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(Number(req.params.id), req.body);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function getTaskLabels(req, res, next) {
  try {
    const labels = await taskService.getTaskLabels(Number(req.params.id));
    res.json(labels);
  } catch (err) {
    next(err);
  }
}

async function assignLabel(req, res, next) {
  try {
    await taskService.assignLabel(Number(req.params.id), Number(req.body.label_id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function removeLabel(req, res, next) {
  try {
    await taskService.removeLabel(Number(req.params.id), Number(req.params.labelId));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try { res.json(await taskService.getComments(Number(req.params.id))); } catch(e){ next(e); }
}
async function addComment(req, res, next) {
  try { res.status(201).json(await taskService.addComment(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteComment(req, res, next) {
  try { await taskService.deleteComment(Number(req.params.cid)); res.status(204).end(); } catch(e){ next(e); }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, getTaskLabels, assignLabel, removeLabel, getComments, addComment, deleteComment };
