const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/error');
const app = express();
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));
app.use(morgan('dev'));
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174,https://customercare-registry.onrender.com').split(',');
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins to fix the issue quickly
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 200, // limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP addresses, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount routes mapping
 app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve React index.html for any non-API routes in production

  // Fallback Route Handler (404 for development)
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: 'Requested API endpoint does not exist.'
    });
  });

// Centralized error boundary
app.use(errorHandler);

module.exports = app;
