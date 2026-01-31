import express from 'express';
import {
  registerUser,
  loginUser,
  updateUser
} from '../controllers/userController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate
} from '../middleware/validation.js';
import { sanitizeRequestBody } from '../middleware/sanitization.js';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/users - Register a new user/customer
router.post('/', registrationRateLimiter, validateUserRegistration, sanitizeRequestBody, asyncHandler(registerUser));

// POST /api/users/login - Login for users/customers
router.post('/login', loginRateLimiter, validateUserLogin, sanitizeRequestBody, asyncHandler(loginUser));

// PUT /api/users/:id - Update a user profile
router.put('/:id', validateUserUpdate, sanitizeRequestBody, asyncHandler(updateUser));

export default router;
