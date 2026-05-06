'use strict';
const s = require('../services/calendarService');

async function listEvents(req, res, next) {
  try { res.json(await s.getEvents(req.query.user_id, req.query)); } catch(e){ next(e); }
}
async function getEvent(req, res, next) {
  try { res.json(await s.getEventById(Number(req.params.id))); } catch(e){ next(e); }
}
async function createEvent(req, res, next) {
  try { res.status(201).json(await s.createEvent(req.body)); } catch(e){ next(e); }
}
async function updateEvent(req, res, next) {
  try { res.json(await s.updateEvent(Number(req.params.id), req.body)); } catch(e){ next(e); }
}
async function deleteEvent(req, res, next) {
  try { await s.deleteEvent(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
