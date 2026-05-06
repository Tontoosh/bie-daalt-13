'use strict';

const { Router } = require('express');
const c = require('../controllers/taskController');
const { validateTask, validateLabelAssign } = require('../middleware/validator');

const router = Router();

router.get('/',                         c.listTasks);
router.get('/:id',                      c.getTask);
router.post('/',          validateTask,  c.createTask);
router.patch('/:id',                    c.updateTask);
router.delete('/:id',                   c.deleteTask);
router.get('/:id/labels',               c.getTaskLabels);
router.post('/:id/labels', validateLabelAssign, c.assignLabel);
router.delete('/:id/labels/:labelId',   c.removeLabel);

module.exports = router;
