import express from 'express';
import {
  createAppointment,
  getAppointments,
  acceptAppointment,
  rejectAppointment,
  suggestAppointment,
  acceptSuggestion,
  rejectSuggestion
} from '../controllers/appointmentController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateAppointmentCreation,
  validateAppointmentId,
  validateAppointmentSuggestion,
  validateGetAppointments
} from '../middleware/validation.js';
import { sanitizeRequestBody, sanitizeQueryParams } from '../middleware/sanitization.js';
import { authenticate, requireUserType } from '../middleware/auth.js';

const router = express.Router();

// POST /api/appointments - Create a new appointment (requires authentication)
router.post('/', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentCreation, 
  sanitizeRequestBody, 
  asyncHandler(createAppointment)
);

// GET /api/appointments - Get appointments (requires authentication)
router.get('/', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateGetAppointments, 
  sanitizeQueryParams, 
  asyncHandler(getAppointments)
);

// PUT /api/appointments/:id/accept - Accept an appointment (requires authentication)
router.put('/:id/accept', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentId, 
  asyncHandler(acceptAppointment)
);

// PUT /api/appointments/:id/reject - Reject an appointment (requires authentication)
router.put('/:id/reject', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentId, 
  asyncHandler(rejectAppointment)
);

// PUT /api/appointments/:id/suggest - Suggest new date/time for an appointment (requires authentication)
router.put('/:id/suggest', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentSuggestion, 
  sanitizeRequestBody, 
  asyncHandler(suggestAppointment)
);

// PUT /api/appointments/:id/accept-suggestion - Customer accepts suggested date/time (requires authentication)
router.put('/:id/accept-suggestion', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentId, 
  asyncHandler(acceptSuggestion)
);

// PUT /api/appointments/:id/reject-suggestion - Customer rejects suggested date/time (requires authentication)
router.put('/:id/reject-suggestion', 
  authenticate, 
  requireUserType(['user', 'stylist']), 
  validateAppointmentId, 
  asyncHandler(rejectSuggestion)
);

export default router;
