'use strict';
const s = require('../services/projectService');

async function listProjects(req, res, next) {
  try { res.json(await s.getProjects(req.query.user_id)); } catch(e){ next(e); }
}
async function getProject(req, res, next) {
  try { res.json(await s.getProjectById(Number(req.params.id))); } catch(e){ next(e); }
}
async function createProject(req, res, next) {
  try { res.status(201).json(await s.createProject(req.body)); } catch(e){ next(e); }
}
async function updateProject(req, res, next) {
  try { res.json(await s.updateProject(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteProject(req, res, next) {
  try { await s.deleteProject(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
async function getMembers(req, res, next) {
  try { res.json(await s.getMembers(Number(req.params.id))); } catch(e){ next(e); }
}
module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, getMembers };
