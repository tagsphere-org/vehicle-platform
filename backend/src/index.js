require('dotenv').config();

// Feature flags (validates credentials if enabled)
const features = require('./config/features');
console.log(`Features: firebase=${features.firebase}, razorpay=${features.razorpay}, notifications=${features.notifications}, calls=${features.calls}`);

// Validate required environment variables at startup
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.ENCRYPTION_KEY.length < 32) {
  console.error('FATAL: ENCRYPTION_KEY must be at least 32 characters');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const scanRoutes = require('./routes/scan');
const adminRoutes = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Security middleware — hardened helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS — validate origin
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '1kb' }));
app.use(express.urlencoded({ extended: true, limit: '1kb' }));

// Trust proxy (for rate limiting behind ingress/LB)
app.set('trust proxy', 1);

// Health check
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const dbStatus = mongoState === 1 ? 'connected' : 'disconnected';
  const httpStatus = mongoState === 1 ? 200 : 503;
  res.status(httpStatus).json({ status: dbStatus === 'connected' ? 'ok' : 'degraded', db: dbStatus });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler — no stack trace leakage
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(`[ERROR] ${req.method} ${req.path} - ${err.message}`);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Database connection with connection pooling for 100 concurrent users
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB connected (pool: 10-50)');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TagSphere API running on port ${PORT}`);
  });
});

module.exports = app;
