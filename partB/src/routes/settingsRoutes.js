'use strict';
const { Router } = require('express');
const c = require('../controllers/settingsController');
const r = Router();
r.get('/:userId',    c.getSettings);
r.patch('/:userId',  c.updateSettings);
module.exports = r;
