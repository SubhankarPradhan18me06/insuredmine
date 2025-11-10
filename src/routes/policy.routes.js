const express = require('express');
const router = express.Router();
const policyController = require('../controller/policy.controller');

router.get('/search', policyController.searchByUsername);
router.get('/aggregate/by-user', policyController.aggregateByUser);

module.exports = router;
