const express = require('express');
const router = express.Router();

const {
  createSupportTicket,
  getSupportTickets,
  updateSupportTicketStatus,
  submitFeedback,
  getFeedbacks
} = require('../controllers/supportController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants');

// Support Inquiry and Requests routes
router.route('/requests')
  .post(protect, authorize(ROLES.CUSTOMER), createSupportTicket)
  .get(protect, getSupportTickets);

router.route('/requests/:id')
  .put(protect, authorize(ROLES.ADMIN), updateSupportTicketStatus);

// Feedback reviews
router.route('/feedback')
  .post(protect, authorize(ROLES.CUSTOMER), submitFeedback)
  .get(protect, authorize(ROLES.ADMIN, ROLES.AGENT), getFeedbacks);

module.exports = router;
