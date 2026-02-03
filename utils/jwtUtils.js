import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logError } from './logger.js';

/**
 * Generate a JWT token for a user or stylist
 * @param {Object} payload - The data to encode in the token (id, email, type)
 * @param {string} payload.id - User/Stylist ID
 * @param {string} payload.email - User/Stylist email
 * @param {string} payload.type - 'user' or 'stylist'
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  try {
    const token = jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        type: payload.type // 'user' or 'stylist'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN || '7d', // Default 7 days
        issuer: 'stylists-api',
        audience: 'stylists-app'
      }
    );
    return token;
  } catch (error) {
    logError(error, 'generateToken');
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'stylists-api',
      audience: 'stylists-app'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logError(new Error('Token expired'), 'verifyToken');
      return null;
    } else if (error.name === 'JsonWebTokenError') {
      logError(new Error('Invalid token'), 'verifyToken');
      return null;
    } else {
      logError(error, 'verifyToken');
      return null;
    }
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns {string|null} Token string or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};
