const express = require('express');
const {
  registerUser,
  loginUser,
  getFriends,
  inviteUser,
  getPendingInvites,
  acceptInvite,
  refuseInvite
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/register', upload.single('profileImage'), registerUser);
router.post('/login', loginUser);
router.get('/friends', protect, getFriends);
router.post('/invite', protect, inviteUser);
router.get('/pending-invites', protect, getPendingInvites);
router.post('/accept-invite', protect, acceptInvite);
router.post('/refuse-invite', protect, refuseInvite);
router.get('/online-users', (req, res) => {
  res.json(Object.keys(onlineUsers)); 
});


module.exports = router;
