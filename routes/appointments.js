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

const router = express.Router();

// POST /api/appointments - Create a new appointment
router.post('/', createAppointment);

// GET /api/appointments - Get appointments (optionally filtered by userId or stylistId)
router.get('/', getAppointments);

// PUT /api/appointments/:id/accept - Accept an appointment
router.put('/:id/accept', acceptAppointment);

// PUT /api/appointments/:id/reject - Reject an appointment
router.put('/:id/reject', rejectAppointment);

// PUT /api/appointments/:id/suggest - Suggest new date/time for an appointment
router.put('/:id/suggest', suggestAppointment);

// PUT /api/appointments/:id/accept-suggestion - Customer accepts suggested date/time
router.put('/:id/accept-suggestion', acceptSuggestion);

// PUT /api/appointments/:id/reject-suggestion - Customer rejects suggested date/time
router.put('/:id/reject-suggestion', rejectSuggestion);

export default router;
