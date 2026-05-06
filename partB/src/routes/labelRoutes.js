'use strict';

const { Router } = require('express');
const c = require('../controllers/labelController');
const { validateLabel } = require('../middleware/validator');

const router = Router();

router.get('/',       c.listLabels);
router.get('/:id',    c.getLabel);
router.post('/',      validateLabel, c.createLabel);
router.patch('/:id',  c.updateLabel);
router.delete('/:id', c.deleteLabel);

module.exports = router;
