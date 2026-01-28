import express from 'express';
import cors from 'cors';
import { paths } from './config/paths.js';
import stylistsRoutes from './routes/stylists.js';
import usersRoutes from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON payloads (images, portfolio)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
