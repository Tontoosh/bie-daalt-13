'use strict';
const s = require('../services/goalService');

async function listGoals(req, res, next) {
  try { res.json(await s.getGoals(req.query.user_id)); } catch(e){ next(e); }
}
async function getGoal(req, res, next) {
  try { res.json(await s.getGoalById(Number(req.params.id))); } catch(e){ next(e); }
}
async function createGoal(req, res, next) {
  try { res.status(201).json(await s.createGoal(req.body)); } catch(e){ next(e); }
}
async function updateGoal(req, res, next) {
  try { res.json(await s.updateGoal(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteGoal(req, res, next) {
  try { await s.deleteGoal(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
async function getMilestones(req, res, next) {
  try { res.json(await s.getMilestones(Number(req.params.id))); } catch(e){ next(e); }
}
async function addMilestone(req, res, next) {
  try { res.status(201).json(await s.addMilestone(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function updateMilestone(req, res, next) {
  try { await s.updateMilestone(Number(req.params.mid), req.body); res.status(204).end(); } catch(e){ next(e); }
}
async function deleteMilestone(req, res, next) {
  try { await s.deleteMilestone(Number(req.params.mid)); res.status(204).end(); } catch(e){ next(e); }
}
module.exports = { listGoals, getGoal, createGoal, updateGoal, deleteGoal, getMilestones, addMilestone, updateMilestone, deleteMilestone };
