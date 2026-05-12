'use strict';
const s = require('../services/notificationService');

async function listNotifications(req, res, next) {
  try { res.json(await s.getNotifications(req.query.user_id, req.query)); } catch(e){ next(e); }
}
async function getCount(req, res, next) {
  try { res.json({ count: await s.getUnreadCount(req.query.user_id) }); } catch(e){ next(e); }
}
async function markRead(req, res, next) {
  try { res.json(await s.markRead(Number(req.params.id))); } catch(e){ next(e); }
}
async function markAllRead(req, res, next) {
  try { await s.markAllRead(req.body.user_id); res.json({ ok: true }); } catch(e){ next(e); }
}
async function deleteNotification(req, res, next) {
  try { await s.deleteNotification(Number(req.params.id)); res.status(204).end(); } catch(e){ next(e); }
}
module.exports = { listNotifications, getCount, markRead, markAllRead, deleteNotification };
