import express from 'express';
import { upload } from '../utils/fileUpload.js';
import {
  getAllStylists,
  getStylistById,
  registerStylist,
  loginStylist,
  updateStylist
} from '../controllers/stylistController.js';

const router = express.Router();

// GET /api/stylists - Get all stylists
router.get('/', getAllStylists);

// GET /api/stylists/:id - Get a single stylist by ID
router.get('/:id', getStylistById);

// POST /api/stylists - Register a new stylist
router.post('/', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'portfolioPictures', maxCount: 10 }
]), registerStylist);

// POST /api/stylists/login - Login for registered stylists
router.post('/login', loginStylist);

// PUT /api/stylists/:id - Update a stylist profile
router.put('/:id', updateStylist);

export default router;
