'use strict';
const s = require('../services/settingsService');

async function getSettings(req, res, next) {
  try { res.json(await s.getSettings(Number(req.params.userId))); } catch(e){ next(e); }
}
async function updateSettings(req, res, next) {
  try { res.json(await s.updateSettings(Number(req.params.userId), req.body)); } catch(e){ next(e); }
}
module.exports = { getSettings, updateSettings };
