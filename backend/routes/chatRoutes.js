const express = require('express');
const { getChats, getMessages, sendMessage, getOrCreateChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getChats);
router.get('/:chatId/messages', protect, getMessages);
router.post('/:chatId/send', protect, sendMessage);
router.post('/create-or-get', protect, getOrCreateChat); // Add this route

module.exports = router;
