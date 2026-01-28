import { stylists, appointments, saveAppointments } from '../utils/dataStore.js';
import { logError } from '../utils/errorSanitizer.js';

/**
 * Create a new appointment
 */
export const createAppointment = (req, res) => {
  try {
    const {
      stylistId,
      userId,
      purpose,
      date,
      time,
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    if (!stylistId || !purpose || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stylistId, purpose, date, and time are required'
      });
    }

    // Verify stylist exists
    const stylist = stylists.find(s => s.id === parseInt(stylistId));
    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Generate new appointment ID
    const maxId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) : 0;
    const newId = maxId + 1;

    // Create new appointment
    const newAppointment = {
      id: newId,
      stylistId: parseInt(stylistId),
      userId: userId ? parseInt(userId) : null,
      purpose: purpose.trim(),
      date: date.trim(),
      time: time.trim(),
      customerName: customerName ? customerName.trim() : '',
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      services: req.body.services || [],
      status: 'pending',
      suggestedDate: null,
      suggestedTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    saveAppointments();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment
    });
  } catch (error) {
    logError(error, 'createAppointment');
    res.status(500).json({
      success: false,
      message: 'Error booking appointment. Please try again.'
    });
  }
};

/**
 * Get appointments (optionally filtered by userId or stylistId)
 */
export const getAppointments = (req, res) => {
  try {
    const { userId, stylistId } = req.query;
    
    let filteredAppointments = [...appointments];
    
    // Filter by userId if provided
    if (userId) {
      const userIdNum = parseInt(userId);
      filteredAppointments = filteredAppointments.filter(a => a.userId === userIdNum);
    }
    
    // Filter by stylistId if provided
    if (stylistId) {
      const stylistIdNum = parseInt(stylistId);
      filteredAppointments = filteredAppointments.filter(a => a.stylistId === stylistIdNum);
    }
    
    // Sort by date and time (most recent first)
    filteredAppointments.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      data: filteredAppointments
    });
  } catch (error) {
    logError(error, 'getAppointments');
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments. Please try again.'
    });
  }
};

/**
 * Accept an appointment
 */
export const acceptAppointment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    appointments[appointmentIndex].status = 'confirmed';
    appointments[appointmentIndex].updatedAt = new Date().toISOString();
    saveAppointments();
    
    res.json({
      success: true,
      message: 'Appointment accepted',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    logError(error, 'acceptAppointment');
    res.status(500).json({
      success: false,
      message: 'Error accepting appointment. Please try again.'
    });
  }
};

/**
 * Reject an appointment
 */
export const rejectAppointment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    appointments[appointmentIndex].status = 'cancelled';
    appointments[appointmentIndex].updatedAt = new Date().toISOString();
    saveAppointments();
    
    res.json({
      success: true,
      message: 'Appointment rejected',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    logError(error, 'rejectAppointment');
    res.status(500).json({
      success: false,
      message: 'Error rejecting appointment. Please try again.'
    });
  }
};

/**
 * Suggest new date/time for an appointment
 */
export const suggestAppointment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { suggestedDate, suggestedTime } = req.body;
    
    if (!suggestedDate || !suggestedTime) {
      return res.status(400).json({
        success: false,
        message: 'Suggested date and time are required'
      });
    }
    
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    appointments[appointmentIndex].suggestedDate = suggestedDate.trim();
    appointments[appointmentIndex].suggestedTime = suggestedTime.trim();
    appointments[appointmentIndex].status = 'pending'; // Keep as pending until customer accepts
    appointments[appointmentIndex].updatedAt = new Date().toISOString();
    saveAppointments();
    
    res.json({
      success: true,
      message: 'Date/time suggestion sent',
      data: appointments[appointmentIndex]
    });
  } catch (error) {
    logError(error, 'suggestAppointment');
    res.status(500).json({
      success: false,
      message: 'Error suggesting date/time. Please try again.'
    });
  }
};

/**
 * Customer accepts suggested date/time
 */
export const acceptSuggestion = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    const appointment = appointments[appointmentIndex];
    
    if (!appointment.suggestedDate || !appointment.suggestedTime) {
      return res.status(400).json({
        success: false,
        message: 'No suggestion found for this appointment'
      });
    }
    
    // Update appointment with suggested date/time
    appointment.date = appointment.suggestedDate;
    appointment.time = appointment.suggestedTime;
    appointment.suggestedDate = null;
    appointment.suggestedTime = null;
    appointment.status = 'confirmed'; // Confirm the appointment when customer accepts
    appointment.updatedAt = new Date().toISOString();
    saveAppointments();
    
    res.json({
      success: true,
      message: 'Appointment date/time updated successfully',
      data: appointment
    });
  } catch (error) {
    logError(error, 'acceptSuggestion');
    res.status(500).json({
      success: false,
      message: 'Error accepting suggestion. Please try again.'
    });
  }
};

/**
 * Customer rejects suggested date/time
 */
export const rejectSuggestion = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    const appointment = appointments[appointmentIndex];
    
    // Clear the suggestion but keep original date/time
    appointment.suggestedDate = null;
    appointment.suggestedTime = null;
    appointment.status = 'pending'; // Keep as pending since customer rejected suggestion
    appointment.updatedAt = new Date().toISOString();
    saveAppointments();
    
    res.json({
      success: true,
      message: 'Suggestion rejected. Original appointment time remains.',
      data: appointment
    });
  } catch (error) {
    logError(error, 'rejectSuggestion');
    res.status(500).json({
      success: false,
      message: 'Error rejecting suggestion. Please try again.'
    });
  }
};
