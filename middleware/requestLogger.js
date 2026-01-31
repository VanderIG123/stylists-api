import { logRequest } from '../utils/logger.js';

/**
 * Middleware to log HTTP requests
 * Should be placed after body parsing middleware but before routes
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the request
    logRequest(req, res, responseTime);
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};
