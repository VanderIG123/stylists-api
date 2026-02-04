import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { paths } from './config/paths.js';
import { env } from './config/env.js';
import stylistsRoutes from './routes/stylists.js';
import usersRoutes from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import logger, { logInfo } from './utils/logger.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins and local network IPs for mobile testing
    if (env.isDevelopment()) {
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.')) {
        return callback(null, true);
      }
    }
    
    // Check if origin is in allowed list (supports multiple origins separated by commas)
    const allowedOrigins = env.FRONTEND_URL.split(',').map(url => url.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, be strict; in development, log warning but allow
      if (env.isProduction()) {
        callback(new Error('Not allowed by CORS'));
      } else {
        console.warn(`CORS: Origin ${origin} not in allowed list, but allowing in development`);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
// Security headers with Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from various sources for uploaded files
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources for uploaded files
  // Disable X-Powered-By header (already handled by Helmet)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Configure other security headers
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Permissions policy
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
    },
  },
}));

app.use(cors(corsOptions));
// Apply general rate limiting to all routes (baseline protection)
app.use(generalRateLimiter);
app.use(express.json({ limit: `${env.MAX_REQUEST_BODY_SIZE / 1024 / 1024}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_REQUEST_BODY_SIZE / 1024 / 1024}mb` }));

// Request logging middleware (after body parsing, before routes)
app.use(requestLogger);

// Serve uploaded files statically
app.use('/uploads', express.static(paths.uploadsDir));

// Routes
app.use('/api/stylists', stylistsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/appointments', appointmentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server - listen on all network interfaces (0.0.0.0) to allow mobile access
app.listen(env.PORT, '0.0.0.0', () => {
  logInfo('Server started', {
    port: env.PORT,
    apiBaseUrl: env.API_BASE_URL,
    environment: env.NODE_ENV,
    corsOrigins: env.FRONTEND_URL,
    logLevel: process.env.LOG_LEVEL || (env.isProduction() ? 'info' : 'debug'),
  });
  
  logger.info('API Endpoints:', {
    endpoints: [
      'GET /api/stylists - Get all stylists',
      'GET /api/stylists/:id - Get a single stylist by ID',
      'POST /api/stylists - Register a new stylist',
      'POST /api/stylists/login - Login for stylists',
      'PUT /api/stylists/:id - Update a stylist profile',
      'POST /api/users - Register a new user/customer',
      'POST /api/users/login - Login for users/customers',
      'PUT /api/users/:id - Update a user profile',
      'POST /api/appointments - Create a new appointment',
      'GET /api/appointments - Get appointments',
      'PUT /api/appointments/:id/accept - Accept an appointment',
      'PUT /api/appointments/:id/reject - Reject an appointment',
      'PUT /api/appointments/:id/suggest - Suggest new date/time',
      'PUT /api/appointments/:id/accept-suggestion - Accept suggestion',
      'PUT /api/appointments/:id/reject-suggestion - Reject suggestion',
      'GET /health - Health check',
    ],
  });
});
