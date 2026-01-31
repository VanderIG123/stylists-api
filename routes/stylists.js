import express from 'express';
import { upload } from '../utils/fileUpload.js';
import {
  getAllStylists,
  getStylistById,
  registerStylist,
  loginStylist,
  updateStylist
} from '../controllers/stylistController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateStylistRegistration,
  validateStylistLogin,
  validateStylistUpdate
} from '../middleware/validation.js';
import { param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';
import { sanitizeRequestBody } from '../middleware/sanitization.js';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/stylists - Get all stylists
router.get('/', getAllStylists);

// GET /api/stylists/:id - Get a single stylist by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Invalid stylist ID'),
  handleValidationErrors
], getStylistById);

// POST /api/stylists - Register a new stylist
router.post('/', registrationRateLimiter, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'portfolioPictures', maxCount: 10 }
]), validateStylistRegistration, sanitizeRequestBody, asyncHandler(registerStylist));

// POST /api/stylists/login - Login for registered stylists
router.post('/login', loginRateLimiter, validateStylistLogin, sanitizeRequestBody, asyncHandler(loginStylist));

// PUT /api/stylists/:id - Update a stylist profile
router.put('/:id', validateStylistUpdate, sanitizeRequestBody, asyncHandler(updateStylist));

export default router;
