const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Chat = require('../models/Chat'); // Import the Chat model

// Generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, profileImageUrl } = req.body; // Ensure profileImageUrl is retrieved from req.body

  try {
    let profileImage = profileImageUrl || 'default-profile-image-url'; // Use provided URL or default

    const user = new User({ name, email, password, profileImage });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login a user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      message: 'User logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Fetch friends
const getFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'name email profileImage');
  res.status(200).json(user.friends);
});
// Invite a user
const inviteUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const invitingUser = req.user;

  const invitedUser = await User.findOne({ email });
  if (!invitedUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if the invite already exists
  if (invitedUser.pendingInvites.includes(invitingUser._id)) {
    res.status(400);
    throw new Error('Invite already sent');
  }

  invitedUser.pendingInvites.push(invitingUser._id);
  await invitedUser.save();

  res.status(200).json({ message: 'Invite sent' });
});

// Fetch pending invites
const getPendingInvites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('pendingInvites', 'name email');
  res.status(200).json(user.pendingInvites);
});

// Accept invite
const acceptInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.body;
  const user = await User.findById(req.user._id);

  const invitingUser = await User.findById(inviteId);
  if (!invitingUser) {
    res.status(404);
    throw new Error('Inviting user not found');
  }

  user.pendingInvites = user.pendingInvites.filter(id => id.toString() !== inviteId);
  await user.save();

  // Create or update a chat between the two users
  let chat = await Chat.findOne({ users: { $all: [req.user._id, invitingUser._id] } });
  if (!chat) {
    chat = new Chat({
      users: [req.user._id, invitingUser._id],
    });
    await chat.save();
  }

  // Add each other as friends (optional)
  user.friends.push(invitingUser._id);
  invitingUser.friends.push(req.user._id);

  await user.save();
  await invitingUser.save();

  res.status(200).json({ message: 'Invite accepted' });
});

// Refuse invite
const refuseInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.body;
  const user = await User.findById(req.user._id);

  user.pendingInvites = user.pendingInvites.filter(id => id.toString() !== inviteId);
  await user.save();

  res.status(200).json({ message: 'Invite refused' });
});



module.exports = {
  registerUser,
  loginUser,
  getFriends,
  inviteUser,
  getPendingInvites,
  acceptInvite,
  refuseInvite,
};
