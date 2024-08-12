const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messages');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('login', (userId) => {
    console.log(`User ${userId} is online`);
    onlineUsers[userId] = socket.id;
    io.emit('online', userId); // Notify all clients that the user is online
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');

    // Find the userId associated with the disconnected socket
    let userId = Object.keys(onlineUsers).find(id => onlineUsers[id] === socket.id);

    if (userId) {
      delete onlineUsers[userId];
      io.emit('offline', userId); // Notify all clients that the user is offline
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
