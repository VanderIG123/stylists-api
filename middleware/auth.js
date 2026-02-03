import { verifyToken, extractTokenFromHeader } from '../utils/jwtUtils.js';
import { logError, logWarn } from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user/stylist info to request
 */
export const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type // 'user' or 'stylist'
    };

    next();
  } catch (error) {
    logError(error, 'authenticate');
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.'
    });
  }
};

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't require it
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          type: decoded.type
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    logWarn('Optional authentication failed', { error: error.message });
    next();
  }
};

/**
 * Authorization middleware - requires specific user type
 * @param {string|string[]} allowedTypes - 'user', 'stylist', or ['user', 'stylist']
 */
export const requireUserType = (allowedTypes) => {
  const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
  
  return (req, res, next) => {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Check if user type is allowed
    if (!types.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Authorization middleware - requires user to own the resource
 * Checks if req.user.id matches the resource ID in params
 */
export const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  const resourceId = parseInt(req.params.id);
  const userId = req.user.id;

  if (resourceId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};
