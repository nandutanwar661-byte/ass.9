const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const dns = require("dns");
// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const ensureDemoUsers = require('./utils/ensureDemoUsers');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const visitorRoutes = require('./routes/visitors');
const appointmentRoutes = require('./routes/appointments');
const passRoutes = require('./routes/passes');
const checkLogRoutes = require('./routes/checkLogs');
const reportRoutes = require('./routes/reports');

const app = express();

// Trust proxy - needed for rate limiting and X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

const corsAllowed = new Set(
  [
    process.env.CLIENT_URL,
    'https://cosmic-meringue-0d2f4a.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].filter(Boolean),
);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsAllowed.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploaded photos, generated PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/passes', express.static(path.join(__dirname, 'passes')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/check-logs', checkLogRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VisiPass API is running', timestamp: new Date() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  await connectDB();
  await ensureDemoUsers();

  server = app.listen(PORT, () => {
    console.log(`VisiPass server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = app;
