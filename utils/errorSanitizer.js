/**
 * Sanitize error messages to prevent exposing sensitive information
 * @param {Error|string} error - Error object or error message
 * @returns {string} - Sanitized error message safe for client responses
 */
export const sanitizeErrorMessage = (error) => {
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message || error.toString();
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    return 'An unexpected error occurred';
  }

  // List of sensitive patterns to remove or replace
  const sensitivePatterns = [
    // File system paths
    /\/[^\s]+/g,
    // Absolute paths (Windows)
    /[A-Z]:\\[^\s]+/g,
    // Email addresses (in some contexts)
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Passwords (common patterns)
    /password[:\s]+[^\s]+/gi,
    // API keys/tokens
    /(api[_-]?key|token|secret)[:\s]+[^\s]+/gi,
    // Database connection strings
    /(mongodb|postgres|mysql):\/\/[^\s]+/gi,
    // Stack traces
    /at\s+[^\s]+\s+\([^)]+\)/g,
    // Internal file paths
    /\/Users\/[^\s]+/g,
    /\/home\/[^\s]+/g,
    /\/var\/[^\s]+/g,
    /\/tmp\/[^\s]+/g,
    // Node modules paths
    /node_modules\/[^\s]+/g,
  ];

  // Remove sensitive patterns
  let sanitized = errorMessage;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // If everything was redacted, return a generic message
  if (sanitized.trim().length === 0 || sanitized === '[REDACTED]') {
    return 'An error occurred while processing your request';
  }

  // Limit message length to prevent information leakage
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
};

/**
 * Get a safe, user-friendly error message based on error type
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default message if error type is unknown
 * @returns {string} - Safe error message
 */
export const getSafeErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // Common error types with safe messages
  const errorTypeMap = {
    'ValidationError': 'Invalid input provided',
    'CastError': 'Invalid data format',
    'MongoError': 'Database operation failed',
    'MulterError': 'File upload error',
    'ENOENT': 'File or directory not found',
    'EACCES': 'Permission denied',
    'ENOTFOUND': 'Network error',
    'ECONNREFUSED': 'Connection refused',
    'ETIMEDOUT': 'Request timeout',
  };

  // Check error name/type
  if (error.name && errorTypeMap[error.name]) {
    return errorTypeMap[error.name];
  }

  // Check error code
  if (error.code && errorTypeMap[error.code]) {
    return errorTypeMap[error.code];
  }

  // For known error types, return sanitized message
  if (error.message) {
    const sanitized = sanitizeErrorMessage(error);
    // Only return sanitized if it's not too generic
    if (sanitized !== 'An error occurred while processing your request') {
      return sanitized;
    }
  }

  return defaultMessage;
};

/**
 * Log error with full details (server-side only)
 * @deprecated Use logError from utils/logger.js instead
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  // Import logger dynamically to avoid circular dependencies
  import('../utils/logger.js').then(({ logError: loggerLogError }) => {
    loggerLogError(error, { context });
  }).catch(() => {
    // Fallback to console if logger import fails
    const timestamp = new Date().toISOString();
    const contextMsg = context ? `[${context}] ` : '';
    console.error(`${contextMsg}Error at ${timestamp}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
    });
  });
};
