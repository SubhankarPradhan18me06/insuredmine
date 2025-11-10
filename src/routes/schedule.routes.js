const express = require('express');
const router = express.Router();
const scheduleController = require('../controller/schedule.controller');

router.post('/', scheduleController.createSchedule);

module.exports = router;
