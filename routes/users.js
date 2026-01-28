import express from 'express';
import {
  registerUser,
  loginUser,
  updateUser
} from '../controllers/userController.js';

const router = express.Router();

// POST /api/users - Register a new user/customer
router.post('/', registerUser);

// POST /api/users/login - Login for users/customers
router.post('/login', loginUser);

// PUT /api/users/:id - Update a user profile
router.put('/:id', updateUser);

export default router;
