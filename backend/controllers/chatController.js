const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Get or create a chat between two users
const getOrCreateChat = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  
  if (!req.user._id || !recipientId) {
    res.status(400);
    throw new Error('Sender and recipient are required');
  }

  // Check if a chat already exists between the two users
  let chat = await Chat.findOne({
    users: { $all: [req.user._id, recipientId] }
  });

  // If no chat exists, create a new one
  if (!chat) {
    chat = new Chat({ users: [req.user._id, recipientId] });
    await chat.save();
  }

  res.status(200).json(chat);
});

// Get all chats for the logged-in user
const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ users: req.user._id }).populate('users', 'name email');
  res.json(chats);
});

// Get messages for a specific chat
const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chat: chatId }).sort('createdAt');
  res.json(messages);
});

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  if (!req.user._id || !content || !chatId) {
    res.status(400);
    throw new Error('Sender, content, and chatId are required');
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const recipient = chat.users.find(user => user.toString() !== req.user._id.toString());

  if (!recipient) {
    res.status(400);
    throw new Error('Recipient not found');
  }

  const message = new Message({
    sender: req.user._id,
    content,
    chat: chatId,
    recipient,
  });

  await message.save();

  chat.latestMessage = message;
  await chat.save();

  res.status(201).json(message);
});

module.exports = {
  getChats,
  getMessages,
  sendMessage,
  getOrCreateChat, // Export the new controller function
};
