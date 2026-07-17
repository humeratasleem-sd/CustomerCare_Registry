const express = require('express');
const router = express.Router();

const { getAdminAnalytics, getAgentAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants');

router.get('/admin', protect, authorize(ROLES.ADMIN), getAdminAnalytics);
router.get('/agent', protect, authorize(ROLES.AGENT), getAgentAnalytics);

module.exports = router;
