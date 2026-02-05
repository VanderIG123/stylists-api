import { body, validationResult, param, query } from 'express-validator';
import { isValidEmail, isValidPhone, validatePassword, isValidLength } from '../utils/inputSanitizer.js';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const fieldErrors = {};
    const errorMessages = [];
    
    // Group errors by field and create helpful messages
    errorArray.forEach(err => {
      const field = err.path || err.param;
      const message = err.msg;
      
      // Map field names to user-friendly names
      const fieldNameMap = {
        'name': 'Full Name',
        'email': 'Email',
        'password': 'Password',
        'phone': 'Phone Number',
        'address': 'Address',
        'preferences': 'Preferences',
        'specialty': 'Specialty',
        'hairTextureTypes': 'Hair Texture Types',
        'yearsOfExperience': 'Years of Experience',
        'rate': 'Rate',
        'hours': 'Business Hours',
        'currentAvailability': 'Current Availability',
        'willingToTravel': 'Willing to Travel',
        'about': 'About Section',
        'accommodations': 'Accommodations',
        'lastMinuteBookingsAllowed': 'Last Minute Bookings',
        'streetParkingAvailable': 'Street Parking',
        'cancellationPolicy': 'Cancellation Policy',
        'acceptedPaymentTypes': 'Accepted Payment Types',
        'services': 'Services',
        'products': 'Products'
      };
      
      const friendlyFieldName = fieldNameMap[field] || field;
      
      // Create more helpful error messages
      let helpfulMessage = message;
      
      if (message.includes('required')) {
        helpfulMessage = `${friendlyFieldName} is required. Please fill in this field.`;
      } else if (message.includes('pattern') || message.includes('match') || message.includes('expected pattern')) {
        // Handle pattern matching errors
        if (field === 'name') {
          helpfulMessage = `${friendlyFieldName} can only contain letters, spaces, hyphens, apostrophes, and periods. Numbers and special characters are not allowed.`;
        } else if (field === 'phone') {
          helpfulMessage = `${friendlyFieldName} can only contain numbers and formatting characters (spaces, hyphens, parentheses, dots, or +). Letters are not allowed.`;
        } else if (field === 'date' || message.includes('YYYY-MM-DD')) {
          helpfulMessage = `${friendlyFieldName} must be in YYYY-MM-DD format (e.g., 2024-12-25).`;
        } else if (field === 'time' || message.includes('HH:MM')) {
          helpfulMessage = `${friendlyFieldName} must be in HH:MM format using 24-hour time (e.g., 14:30).`;
        } else {
          helpfulMessage = `${friendlyFieldName} contains invalid characters. Please check the format.`;
        }
      } else if (message.includes('email')) {
        helpfulMessage = `Please enter a valid email address (e.g., example@domain.com)`;
      } else if (message.includes('phone')) {
        if (message.includes('format')) {
          helpfulMessage = `Phone number can only contain numbers and formatting characters (spaces, hyphens, parentheses, dots, or +).`;
        } else if (message.includes('digits')) {
          helpfulMessage = `Phone number must be between 7 and 15 digits.`;
        } else {
          helpfulMessage = `Please enter a valid phone number.`;
        }
      } else if (message.includes('password')) {
        if (message.includes('length')) {
          helpfulMessage = `Password must be between 6 and 128 characters long.`;
        } else {
          helpfulMessage = `Please enter a valid password.`;
        }
      } else if (message.includes('length')) {
        helpfulMessage = `${friendlyFieldName} ${message}`;
      }
      
      fieldErrors[field] = helpfulMessage;
      errorMessages.push(helpfulMessage);
    });
    
    // Create a general message
    const generalMessage = errorMessages.length === 1 
      ? errorMessages[0]
      : `Please fix the following issues: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`;
    
    return res.status(400).json({
      success: false,
      message: generalMessage,
      errors: errorArray.map(err => ({
        field: err.path || err.param,
        message: fieldErrors[err.path || err.param] || err.msg,
        value: err.value
      })),
      fieldErrors: fieldErrors
    });
  }
  
  next();
};

// ==================== User Validation Rules ====================

export const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\-\(\)\.\+]+$/).withMessage('Invalid phone number format')
    .custom((value) => {
      const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
      if (cleaned.length < 7 || cleaned.length > 15) {
        throw new Error('Phone number must be between 7 and 15 digits');
      }
      if (!/^\d+$/.test(cleaned)) {
        throw new Error('Phone number must contain only digits');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  
  body('preferences')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Preferences must be less than 1000 characters'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

export const validateUserUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'\-\.]+$/).withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\.\+]+$/).withMessage('Invalid phone number format')
    .custom((value) => {
      if (!value) return true;
      const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
      if (cleaned.length < 7 || cleaned.length > 15) {
        throw new Error('Phone number must be between 7 and 15 digits');
      }
      if (!/^\d+$/.test(cleaned)) {
        throw new Error('Phone number must contain only digits');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  
  body('preferences')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Preferences must be less than 1000 characters'),
  
  handleValidationErrors
];

// ==================== Stylist Validation Rules ====================

export const validateStylistRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'\-\.]+$/).withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\-\(\)\.\+]+$/).withMessage('Invalid phone number format')
    .custom((value) => {
      const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
      if (cleaned.length < 7 || cleaned.length > 15) {
        throw new Error('Phone number must be between 7 and 15 digits');
      }
      if (!/^\d+$/.test(cleaned)) {
        throw new Error('Phone number must contain only digits');
      }
      return true;
    }),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters'),
  
  body('specialty')
    .trim()
    .notEmpty().withMessage('Specialty is required')
    .isLength({ min: 3, max: 200 }).withMessage('Specialty must be between 3 and 200 characters'),
  
  body('hairTextureTypes')
    .notEmpty().withMessage('Hair texture types are required'),
  
  body('yearsOfExperience')
    .trim()
    .notEmpty().withMessage('Years of experience is required')
    .isLength({ max: 50 }).withMessage('Years of experience must be less than 50 characters'),
  
  body('rate')
    .trim()
    .notEmpty().withMessage('Rate is required')
    .isLength({ max: 50 }).withMessage('Rate must be less than 50 characters'),
  
  body('hours')
    .trim()
    .notEmpty().withMessage('Business hours are required')
    .isLength({ max: 500 }).withMessage('Business hours must be less than 500 characters'),
  
  body('currentAvailability')
    .trim()
    .notEmpty().withMessage('Current availability is required')
    .isLength({ max: 200 }).withMessage('Current availability must be less than 200 characters'),
  
  body('willingToTravel')
    .trim()
    .notEmpty().withMessage('Willing to travel information is required')
    .isLength({ max: 200 }).withMessage('Willing to travel must be less than 200 characters'),
  
  body('about')
    .trim()
    .notEmpty().withMessage('About section is required')
    .isLength({ min: 10, max: 2000 }).withMessage('About section must be between 10 and 2000 characters'),
  
  body('accommodations')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Accommodations must be less than 500 characters'),
  
  body('lastMinuteBookingsAllowed')
    .optional()
    .isIn(['Yes', 'No', '']).withMessage('Last minute bookings must be Yes, No, or empty'),
  
  body('streetParkingAvailable')
    .optional()
    .isLength({ max: 200 }).withMessage('Street parking information must be less than 200 characters'),
  
  body('cancellationPolicy')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Cancellation policy must be less than 1000 characters'),
  
  body('acceptedPaymentTypes')
    .optional(),
  
  body('services')
    .optional()
    .custom((value) => {
      if (!value) return true;
      try {
        const services = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(services)) {
          throw new Error('Services must be an array');
        }
        if (services.length > 50) {
          throw new Error('Maximum 50 services allowed');
        }
        for (const service of services) {
          if (!service.name || typeof service.name !== 'string' || service.name.trim().length === 0) {
            throw new Error('Each service must have a name');
          }
          if (service.name.length > 100) {
            throw new Error('Service name must be less than 100 characters');
          }
          if (service.duration && service.duration.length > 50) {
            throw new Error('Service duration must be less than 50 characters');
          }
          if (service.price && service.price.length > 50) {
            throw new Error('Service price must be less than 50 characters');
          }
        }
        return true;
      } catch (error) {
        throw new Error(error.message || 'Invalid services format');
      }
    }),
  
  body('products')
    .optional()
    .custom((value) => {
      if (!value) return true;
      try {
        const products = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(products)) {
          throw new Error('Products must be an array');
        }
        if (products.length > 20) {
          throw new Error('Maximum 20 products allowed');
        }
        return true;
      } catch (error) {
        throw new Error(error.message || 'Invalid products format');
      }
    }),
  
  handleValidationErrors
];

export const validateStylistLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

export const validateStylistUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid stylist ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'\-\.]+$/).withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\.\+]+$/).withMessage('Invalid phone number format')
    .custom((value) => {
      if (!value) return true;
      const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
      if (cleaned.length < 7 || cleaned.length > 15) {
        throw new Error('Phone number must be between 7 and 15 digits');
      }
      if (!/^\d+$/.test(cleaned)) {
        throw new Error('Phone number must contain only digits');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters'),
  
  body('specialty')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Specialty must be between 3 and 200 characters'),
  
  body('yearsOfExperience')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Years of experience must be less than 50 characters'),
  
  body('rate')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Rate must be less than 50 characters'),
  
  body('hours')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Business hours must be less than 500 characters'),
  
  body('currentAvailability')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Current availability must be less than 200 characters'),
  
  body('willingToTravel')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Willing to travel must be less than 200 characters'),
  
  body('about')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('About section must be between 10 and 2000 characters'),
  
  body('cancellationPolicy')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Cancellation policy must be less than 1000 characters'),
  
  body('services')
    .optional()
    .custom((value) => {
      if (!value) return true;
      try {
        const services = Array.isArray(value) ? value : JSON.parse(value);
        if (!Array.isArray(services)) {
          throw new Error('Services must be an array');
        }
        if (services.length > 50) {
          throw new Error('Maximum 50 services allowed');
        }
        return true;
      } catch (error) {
        throw new Error(error.message || 'Invalid services format');
      }
    }),
  
  handleValidationErrors
];

// ==================== Appointment Validation Rules ====================

export const validateAppointmentCreation = [
  body('stylistId')
    .notEmpty().withMessage('Stylist ID is required')
    .isInt({ min: 1 }).withMessage('Invalid stylist ID'),
  
  body('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  
  body('purpose')
    .trim()
    .notEmpty().withMessage('Purpose is required')
    .isLength({ min: 3, max: 200 }).withMessage('Purpose must be between 3 and 200 characters'),
  
  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  
  body('time')
    .trim()
    .notEmpty().withMessage('Time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format (24-hour)'),
  
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('customerPhone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\(\)\.\+]+$/).withMessage('Invalid phone number format')
    .custom((value) => {
      if (!value) return true;
      const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
      if (cleaned.length < 7 || cleaned.length > 15) {
        throw new Error('Phone number must be between 7 and 15 digits');
      }
      return true;
    }),
  
  body('services')
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (!Array.isArray(value)) {
        throw new Error('Services must be an array');
      }
      if (value.length > 20) {
        throw new Error('Maximum 20 services allowed per appointment');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateAppointmentId = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
  
  handleValidationErrors
];

export const validateAppointmentSuggestion = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid appointment ID'),
  
  body('suggestedDate')
    .trim()
    .notEmpty().withMessage('Suggested date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  
  body('suggestedTime')
    .trim()
    .notEmpty().withMessage('Suggested time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format (24-hour)'),
  
  handleValidationErrors
];

export const validateGetAppointments = [
  query('userId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  
  query('stylistId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid stylist ID'),
  
  handleValidationErrors
];

// ==================== Recently Viewed Validation Rules ====================

export const validateRecentlyViewed = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  
  body('stylistId')
    .notEmpty().withMessage('Stylist ID is required')
    .isInt({ min: 1 }).withMessage('Invalid stylist ID'),
  
  handleValidationErrors
];

export const validateGetRecentlyViewed = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  
  handleValidationErrors
];
