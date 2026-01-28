import { getSafeErrorMessage, logError } from '../utils/errorSanitizer.js';

/**
 * Global error handler middleware
 * Should be used as the last middleware in the app
 * Never exposes sensitive information to clients
 */
export const errorHandler = (err, req, res, next) => {
  // Log full error details server-side only
  logError(err, `${req.method} ${req.path}`);
  
  // Determine status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Get safe error message (never expose sensitive info)
  const safeMessage = getSafeErrorMessage(err, 'An unexpected error occurred');
  
  // Prepare response
  const response = {
    success: false,
    message: safeMessage
  };
  
  // Only include stack trace in development mode (still sanitized)
  // In production, never expose stack traces
  if (process.env.NODE_ENV === 'development' && err.stack) {
    // Sanitize stack trace to remove file paths
    const sanitizedStack = err.stack
      .split('\n')
      .slice(0, 3) // Only first 3 lines
      .map(line => line.replace(/\/[^\s]+/g, '[REDACTED]'))
      .join('\n');
    response.stack = sanitizedStack;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
