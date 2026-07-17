const express = require('express');
const router = express.Router();

const { getChatByComplaint, getChatMessages, postMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/complaint/:complaintId', protect, getChatByComplaint);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, upload.array('attachments', 3), postMessage);

module.exports = router;
