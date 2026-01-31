import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log directory
const logDir = path.join(__dirname, '..', 'logs');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Custom format for file output (JSON for structured logging)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log levels
const logLevel = process.env.LOG_LEVEL || (env.isProduction() ? 'info' : 'debug');

// Create transports array
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: logLevel,
  })
);

// File transports (only in production or if LOG_TO_FILE is enabled)
if (env.isProduction() || process.env.LOG_TO_FILE === 'true') {
  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep error logs for 14 days
      zippedArchive: true,
    })
  );

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d', // Keep combined logs for 7 days
      zippedArchive: true,
    })
  );

  // Access log file (HTTP requests)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: {
    service: 'stylists-api',
    environment: env.NODE_ENV,
  },
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    // Remove trailing newline
    const logMessage = message.trim();
    // Parse and log as access log
    logger.info(logMessage, { type: 'http' });
  },
};

/**
 * Sanitize sensitive data from objects before logging
 */
export const sanitizeForLogging = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'authorization', 'auth', 'secret', 'apiKey', 'apikey'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Log HTTP request
 */
export const logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    // Sanitize request body
    body: req.body ? sanitizeForLogging(req.body) : undefined,
    query: Object.keys(req.query).length > 0 ? sanitizeForLogging(req.query) : undefined,
  };

  // Log based on status code
  if (res.statusCode >= 500) {
    logger.error('HTTP Request', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log error with context
 */
export const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: env.isDevelopment() ? error.stack : undefined,
    ...context,
  };

  logger.error('Error occurred', errorData);
};

/**
 * Log info message
 */
export const logInfo = (message, meta = {}) => {
  logger.info(message, sanitizeForLogging(meta));
};

/**
 * Log warning message
 */
export const logWarn = (message, meta = {}) => {
  logger.warn(message, sanitizeForLogging(meta));
};

/**
 * Log debug message (only in development)
 */
export const logDebug = (message, meta = {}) => {
  if (env.isDevelopment()) {
    logger.debug(message, sanitizeForLogging(meta));
  }
};

export default logger;
