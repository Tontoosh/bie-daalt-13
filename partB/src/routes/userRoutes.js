'use strict';

const { Router } = require('express');
const c = require('../controllers/userController');
const { validateUser, validateLogin } = require('../middleware/validator');

const router = Router();

router.post('/register', validateUser,  c.register);
router.post('/login',    validateLogin, c.login);
router.get('/:id',       c.getUser);
router.patch('/:id',     c.updateUser);
router.delete('/:id',    c.deleteUser);

module.exports = router;
