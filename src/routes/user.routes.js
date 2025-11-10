const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');

router.get('/:id', userController.getUser);
router.get('/', userController.searchUsers);

module.exports = router;
