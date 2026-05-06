'use strict';
const s = require('../services/noteService');

async function listNotes(req, res, next) {
  try { res.json(await s.getAllNotes(req.query.user_id, req.query)); } catch(e){ next(e); }
}
async function getNote(req, res, next) {
  try { res.json(await s.getNoteById(Number(req.params.id))); } catch(e){ next(e); }
}
async function createNote(req, res, next) {
  try { res.status(201).json(await s.createNote(req.body)); } catch(e){ next(e); }
}
async function updateNote(req, res, next) {
  try { res.json(await s.updateNote(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteNote(req, res, next) {
  try { await s.deleteNote(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
module.exports = { listNotes, getNote, createNote, updateNote, deleteNote };
