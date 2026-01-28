import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * Also handles backward compatibility with plain text passwords
 * @param {string} plainPassword - Plain text password to check
 * @param {string} hashedPassword - Stored password (hashed or plain text for backward compatibility)
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  // Check if the stored password is already hashed (bcrypt hashes start with $2a$ or $2b$)
  if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
    // Compare with bcrypt
    return await bcrypt.compare(plainPassword, hashedPassword);
  } else {
    // Backward compatibility: compare plain text passwords
    // This allows existing users to log in, but their password will be hashed on next login
    return plainPassword === hashedPassword;
  }
};

/**
 * Check if a password is already hashed
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is hashed
 */
export const isPasswordHashed = (password) => {
  return password.startsWith('$2a$') || password.startsWith('$2b$');
};
