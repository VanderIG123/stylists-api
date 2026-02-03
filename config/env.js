import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration
 * Centralized access to environment variables with defaults
 */
export const env = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // API configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  
  // Frontend configuration (for CORS)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // File upload limits (in bytes)
  MAX_PROFILE_PICTURE_SIZE: parseInt(process.env.MAX_PROFILE_PICTURE_SIZE || '5242880', 10), // 5MB
  MAX_PORTFOLIO_PICTURE_SIZE: parseInt(process.env.MAX_PORTFOLIO_PICTURE_SIZE || '10485760', 10), // 10MB
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  
  // Request body size limits (in bytes)
  MAX_REQUEST_BODY_SIZE: parseInt(process.env.MAX_REQUEST_BODY_SIZE || '52428800', 10), // 50MB
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || ((process.env.NODE_ENV === 'production' ? null : 'dev-secret-key-change-in-production')),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d', // 7 days default
  
  // Helper functions
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
  isTest: () => env.NODE_ENV === 'test',
};

// Validate required environment variables in production
if (env.isProduction()) {
  const requiredVars = ['API_BASE_URL', 'FRONTEND_URL', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('ERROR: Missing required environment variables in production:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('Please set these variables in your .env file or environment.');
    process.exit(1);
  }
}

// Warn if using default JWT secret in production
if (env.isProduction() && !process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET must be set in production!');
  process.exit(1);
}
