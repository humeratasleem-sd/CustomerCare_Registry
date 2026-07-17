require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/chatSocket');
const { startSlaMonitor } = require('./services/slaMonitor');

// Connect to Database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Mount Socket.IO to HTTP server
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Sockets Handlers
initSocket(io);

// Start SLA Violations monitoring daemon
startSlaMonitor();

// Listen to socket port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
