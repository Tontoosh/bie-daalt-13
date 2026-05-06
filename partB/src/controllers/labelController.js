'use strict';

const labelService = require('../services/labelService');

async function listLabels(req, res, next) {
  try {
    const labels = await labelService.getAllLabels();
    res.json(labels);
  } catch (err) {
    next(err);
  }
}

async function getLabel(req, res, next) {
  try {
    const label = await labelService.getLabelById(Number(req.params.id));
    res.json(label);
  } catch (err) {
    next(err);
  }
}

async function createLabel(req, res, next) {
  try {
    const label = await labelService.createLabel(req.body);
    res.status(201).json(label);
  } catch (err) {
    next(err);
  }
}

async function updateLabel(req, res, next) {
  try {
    const label = await labelService.updateLabel(Number(req.params.id), req.body);
    res.json(label);
  } catch (err) {
    next(err);
  }
}

async function deleteLabel(req, res, next) {
  try {
    await labelService.deleteLabel(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listLabels, getLabel, createLabel, updateLabel, deleteLabel };
