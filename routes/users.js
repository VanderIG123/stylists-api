import express from 'express';
import {
  registerUser,
  loginUser,
  updateUser,
  addToRecentlyViewed,
  getRecentlyViewed
} from '../controllers/userController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateRecentlyViewed,
  validateGetRecentlyViewed
} from '../middleware/validation.js';
import { sanitizeRequestBody } from '../middleware/sanitization.js';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate, requireOwnership, requireUserType } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users - Register a new user/customer
router.post('/', registrationRateLimiter, validateUserRegistration, sanitizeRequestBody, asyncHandler(registerUser));

// POST /api/users/login - Login for users/customers
router.post('/login', loginRateLimiter, validateUserLogin, sanitizeRequestBody, asyncHandler(loginUser));

// PUT /api/users/:id - Update a user profile (requires authentication and ownership)
router.put('/:id', 
  authenticate, 
  requireUserType('user'), 
  requireOwnership,
  validateUserUpdate, 
  sanitizeRequestBody, 
  asyncHandler(updateUser)
);

// POST /api/users/:id/recently-viewed - Add a stylist to user's recently viewed list
router.post('/:id/recently-viewed',
  authenticate,
  requireUserType('user'),
  requireOwnership,
  validateRecentlyViewed,
  sanitizeRequestBody,
  asyncHandler(addToRecentlyViewed)
);

// GET /api/users/:id/recently-viewed - Get user's recently viewed stylists
router.get('/:id/recently-viewed',
  authenticate,
  requireUserType('user'),
  requireOwnership,
  validateGetRecentlyViewed,
  asyncHandler(getRecentlyViewed)
);

export default router;
