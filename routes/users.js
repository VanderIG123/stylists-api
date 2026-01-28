import express from 'express';
import {
  registerUser,
  loginUser,
  updateUser
} from '../controllers/userController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/users - Register a new user/customer
router.post('/', asyncHandler(registerUser));

// POST /api/users/login - Login for users/customers
router.post('/login', asyncHandler(loginUser));

// PUT /api/users/:id - Update a user profile
router.put('/:id', asyncHandler(updateUser));

export default router;
