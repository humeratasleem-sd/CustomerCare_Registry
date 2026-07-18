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
const configuredOrigins = [
  process.env.CLIENT_URL,
  'https://customer-care-registry-silk.vercel.app',
  'https://customer-care-registry.onrender.com'
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname.endsWith('.vercel.app') || hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Sockets Handlers
initSocket(io);

// Start SLA Violations monitoring daemon
startSlaMonitor();

// Listen to port (for both dev and production)
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Export for Vercel
module.exports = app;
