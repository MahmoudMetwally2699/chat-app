const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/:chatId/send', protect, sendMessage); // Updated to use :chatId
router.get('/:chatId/messages', protect, getMessages); // Updated to use :chatId

module.exports = router;
