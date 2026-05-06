'use strict';
const s = require('../services/habitService');

async function listHabits(req, res, next) {
  try { res.json(await s.getHabits(req.query.user_id)); } catch(e){ next(e); }
}
async function getHabit(req, res, next) {
  try { res.json(await s.getHabitById(Number(req.params.id))); } catch(e){ next(e); }
}
async function createHabit(req, res, next) {
  try { res.status(201).json(await s.createHabit(req.body)); } catch(e){ next(e); }
}
async function updateHabit(req, res, next) {
  try { res.json(await s.updateHabit(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteHabit(req, res, next) {
  try { await s.deleteHabit(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
async function logHabit(req, res, next) {
  try {
    const { userId, loggedOn, count, note } = req.body;
    res.json(await s.logHabit(Number(req.params.id), userId, loggedOn || new Date().toISOString().slice(0,10), { count, note }));
  } catch(e){ next(e); }
}
async function getLogs(req, res, next) {
  try { res.json(await s.getLogs(Number(req.params.id), req.query)); } catch(e){ next(e); }
}
async function getStreak(req, res, next) {
  try { res.json({ streak: await s.getStreak(Number(req.params.id)) }); } catch(e){ next(e); }
}
module.exports = { listHabits, getHabit, createHabit, updateHabit, deleteHabit, logHabit, getLogs, getStreak };
