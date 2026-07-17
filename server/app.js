const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/error');

// Initalize express app
const app = express();

// Set security headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow local static files loading
}));

// HTTP logger (Morgan)
app.use(morgan('dev'));

// Enable CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware (prevent brute force, API spam)
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

// Serve uploads folder static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes files import
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

// Fallback Route Handler (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint does not exist.'
  });
});

// Centralized error boundary
app.use(errorHandler);

module.exports = app;
