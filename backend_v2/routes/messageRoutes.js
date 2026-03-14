const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getChatList } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendMessage);
router.get('/history/:otherUserId', protect, getMessages);
router.get('/list', protect, getChatList);

module.exports = router;
