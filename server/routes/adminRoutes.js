const express = require('express');
const router = express.Router();

const {
  getUsers,
  createAgentAccount,
  suspendUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants');

// Categories can be fetched by anyone authenticated to populate drop-downs
router.get('/categories', protect, getCategories);

// Restrict all other routes explicitly to Administrative role
router.use(protect, authorize(ROLES.ADMIN));

router.get('/users', getUsers);
router.post('/agents', createAgentAccount);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/audit-logs', getAuditLogs);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router;
