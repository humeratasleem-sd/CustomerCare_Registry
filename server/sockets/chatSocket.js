const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

const initSocket = (io) => {
  // Store connected users (UserId -> Set of SocketIds)
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Register user to online list
    socket.on('register', (userId) => {
      if (!userId) return;
      socket.userId = userId;
      
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      
      // Let everyone know about changed status
      io.emit('user_status_change', { userId, status: 'online' });
      console.log(`User ${userId} registered online.`);
    });

    // Join room for specific complaint ticket chat
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Typing Indicators
    socket.on('typing', ({ chatId, userName }) => {
      socket.to(chatId).emit('typing_status', { chatId, userName, isTyping: true });
    });

    socket.on('stop_typing', ({ chatId }) => {
      socket.to(chatId).emit('typing_status', { chatId, isTyping: false });
    });

    // Send chat message in real-time
    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, messageText, attachments } = data;

        // 1. Save to DB
        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          messageText,
          attachments: attachments || []
        });

        // 2. Update Chat Thread lastMessageAt & count increments
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.lastMessageAt = Date.now();
          const sender = await User.findById(senderId);
          
          if (sender.role === 'Customer') {
            chat.unreadCountAgent += 1;
            // Notify agent if online
            sendRealTimeNotification(chat.agent.toString(), {
              title: 'New Chat Message',
              message: `Customer sent a new message on Complaint ${chat.complaint}`,
              type: 'New_Message',
              chatId
            });
          } else {
            chat.unreadCountCustomer += 1;
            // Notify customer if online
            sendRealTimeNotification(chat.customer.toString(), {
              title: 'Message from Agent',
              message: `Agent left a message on your complaint ticket`,
              type: 'New_Message',
              chatId
            });
          }
          await chat.save();
        }

        const populatedMessage = await message.populate('sender', 'name email profilePicture role');

        // 3. Broadcast to all users in room
        io.to(chatId).emit('receive_message', populatedMessage);
      } catch (error) {
        console.error(`Socket message transfer exception: ${error.message}`);
        socket.emit('socket_error', { message: 'Message delivery failed.' });
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      if (socket.userId && onlineUsers.has(socket.userId)) {
        const sockets = onlineUsers.get(socket.userId);
        sockets.delete(socket.id);
        
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
          console.log(`User ${socket.userId} logged offline.`);
        }
      }
    });
  });

  // Helper utility to push real-time alerts if recipient is online
  const sendRealTimeNotification = (recipientId, alertData) => {
    if (onlineUsers.has(recipientId)) {
      const sockets = onlineUsers.get(recipientId);
      sockets.forEach(socketId => {
        io.to(socketId).emit('new_inapp_alert', alertData);
      });
    }
  };
};

module.exports = {
  initSocket
};
