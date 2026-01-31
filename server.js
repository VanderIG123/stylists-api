import express from 'express';
import cors from 'cors';
import { paths } from './config/paths.js';
import { env } from './config/env.js';
import stylistsRoutes from './routes/stylists.js';
import usersRoutes from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins for easier testing
    if (env.isDevelopment()) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
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
app.use(cors(corsOptions));
// Apply general rate limiting to all routes (baseline protection)
app.use(generalRateLimiter);
app.use(express.json({ limit: `${env.MAX_REQUEST_BODY_SIZE / 1024 / 1024}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_REQUEST_BODY_SIZE / 1024 / 1024}mb` }));

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

// Start server
app.listen(env.PORT, () => {
  console.log(`Server is running on ${env.API_BASE_URL}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`CORS allowed origins: ${env.FRONTEND_URL}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/stylists - Get all stylists`);
  console.log(`  GET /api/stylists/:id - Get a single stylist by ID`);
  console.log(`  POST /api/stylists - Register a new stylist`);
  console.log(`  POST /api/stylists/login - Login for stylists`);
  console.log(`  PUT /api/stylists/:id - Update a stylist profile`);
  console.log(`  POST /api/users - Register a new user/customer`);
  console.log(`  POST /api/users/login - Login for users/customers`);
  console.log(`  PUT /api/users/:id - Update a user profile`);
  console.log(`  POST /api/appointments - Create a new appointment`);
  console.log(`  GET /api/appointments - Get appointments`);
  console.log(`  PUT /api/appointments/:id/accept - Accept an appointment`);
  console.log(`  PUT /api/appointments/:id/reject - Reject an appointment`);
  console.log(`  PUT /api/appointments/:id/suggest - Suggest new date/time`);
  console.log(`  PUT /api/appointments/:id/accept-suggestion - Accept suggestion`);
  console.log(`  PUT /api/appointments/:id/reject-suggestion - Reject suggestion`);
  console.log(`  GET /health - Health check`);
});
