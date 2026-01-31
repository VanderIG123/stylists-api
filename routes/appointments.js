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

const router = express.Router();

// POST /api/appointments - Create a new appointment
router.post('/', validateAppointmentCreation, sanitizeRequestBody, asyncHandler(createAppointment));

// GET /api/appointments - Get appointments (optionally filtered by userId or stylistId)
router.get('/', validateGetAppointments, sanitizeQueryParams, asyncHandler(getAppointments));

// PUT /api/appointments/:id/accept - Accept an appointment
router.put('/:id/accept', validateAppointmentId, asyncHandler(acceptAppointment));

// PUT /api/appointments/:id/reject - Reject an appointment
router.put('/:id/reject', validateAppointmentId, asyncHandler(rejectAppointment));

// PUT /api/appointments/:id/suggest - Suggest new date/time for an appointment
router.put('/:id/suggest', validateAppointmentSuggestion, sanitizeRequestBody, asyncHandler(suggestAppointment));

// PUT /api/appointments/:id/accept-suggestion - Customer accepts suggested date/time
router.put('/:id/accept-suggestion', validateAppointmentId, asyncHandler(acceptSuggestion));

// PUT /api/appointments/:id/reject-suggestion - Customer rejects suggested date/time
router.put('/:id/reject-suggestion', validateAppointmentId, asyncHandler(rejectSuggestion));

export default router;
