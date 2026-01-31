import { sanitizeObject } from '../utils/inputSanitizer.js';

/**
 * Middleware to sanitize request body
 * Should be used after validation
 */
export const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Exclude password from sanitization (it will be hashed)
    req.body = sanitizeObject(req.body, ['password']);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQueryParams = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};
