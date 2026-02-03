import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Rate limiter for login endpoints
 * Prevents brute force attacks by limiting login attempts
 */
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10), // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address as the key for rate limiting (with proper IPv6 handling)
  keyGenerator: (req) => {
    // Try to get the real IP address (useful behind proxies)
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    return ip === 'unknown' ? 'unknown' : ipKeyGenerator(ip);
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    const retryAfter = Math.ceil(parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10) / 60000);
    res.status(429).json({
      success: false,
      message: `Too many login attempts from this IP. Please try again after ${retryAfter} minutes.`,
      retryAfter: `${retryAfter} minutes`
    });
  },
  // Skip rate limiting in test environment
  skip: () => env.isTest(),
});

/**
 * Rate limiter for registration endpoints
 * Prevents spam account creation
 */
export const registrationRateLimiter = rateLimit({
  windowMs: parseInt(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour default
  max: parseInt(process.env.REGISTRATION_RATE_LIMIT_MAX || '3', 10), // 3 registrations per hour
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ip === 'unknown' ? 'unknown' : ipKeyGenerator(ip);
  },
  handler: (req, res) => {
    const retryAfter = Math.ceil(parseInt(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS || '3600000', 10) / 60000);
    res.status(429).json({
      success: false,
      message: `Too many registration attempts from this IP. Please try again after ${retryAfter} minutes.`,
      retryAfter: `${retryAfter} minutes`
    });
  },
  skip: () => env.isTest(),
});

/**
 * General API rate limiter for all endpoints
 * Provides a baseline protection against abuse
 */
export const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX || '100', 10), // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ip === 'unknown' ? 'unknown' : ipKeyGenerator(ip);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please slow down.',
      retryAfter: '15 minutes'
    });
  },
  skip: () => env.isTest(),
});
