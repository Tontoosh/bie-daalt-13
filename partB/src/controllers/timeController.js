'use strict';
const s = require('../services/timeService');

async function listEntries(req, res, next) {
  try { res.json(await s.getEntries(req.query.user_id, req.query)); } catch(e){ next(e); }
}
async function startTimer(req, res, next) {
  try { res.status(201).json(await s.startTimer(req.body.user_id, req.body)); } catch(e){ next(e); }
}
async function stopTimer(req, res, next) {
  try { res.json(await s.stopTimer(Number(req.params.id))); } catch(e){ next(e); }
}
async function createEntry(req, res, next) {
  try {
    if (!req.body.startedAt) return res.status(400).json({ error: 'startedAt is required' });
    res.status(201).json(await s.createEntry(req.body));
  } catch(e){ next(e); }
}
async function deleteEntry(req, res, next) {
  try { await s.deleteEntry(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
async function getTotals(req, res, next) {
  try { res.json(await s.getTotals(req.query.user_id, req.query)); } catch(e){ next(e); }
}
module.exports = { listEntries, startTimer, stopTimer, createEntry, deleteEntry, getTotals };
