const express = require('express');
const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  acceptComplaint,
  rejectComplaint,
  addInternalNote,
  escalateComplaint,
  resolveComplaint,
  closeComplaint
} = require('../controllers/complaintController');

const { protect, authorize } = require('../middleware/auth');
const { validateCreateComplaint } = require('../validators/complaintValidator');
const upload = require('../middleware/upload');
const { ROLES } = require('../constants');

// Generic listing & retrieval
router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaintById);

// Create tickets only by Customer
router.post('/', protect, authorize(ROLES.CUSTOMER), upload.array('attachments', 5), validateCreateComplaint, createComplaint);

// Status transitioning configs (Agents / Admin only)
router.put('/:id', protect, authorize(ROLES.AGENT, ROLES.ADMIN), updateComplaint);
router.put('/:id/accept', protect, authorize(ROLES.AGENT), acceptComplaint);
router.put('/:id/reject', protect, authorize(ROLES.AGENT), rejectComplaint);
router.post('/:id/notes', protect, authorize(ROLES.AGENT, ROLES.ADMIN), addInternalNote);
router.post('/:id/escalate', protect, authorize(ROLES.AGENT, ROLES.ADMIN), escalateComplaint);

// Resolving tickets (Agent / Admin) Supporting files
router.post('/:id/resolve', protect, authorize(ROLES.AGENT, ROLES.ADMIN), upload.array('resolutionAttachments', 5), resolveComplaint);

// Closing ticket (Customer / Admin)
router.post('/:id/close', protect, authorize(ROLES.CUSTOMER, ROLES.ADMIN), closeComplaint);

module.exports = router;
