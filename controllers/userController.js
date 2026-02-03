import { users, userCredentials, saveUsers, saveCredentials } from '../utils/dataStore.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';
import { logError } from '../utils/logger.js';
import { generateToken } from '../utils/jwtUtils.js';

/**
 * Register a new user/customer
 */
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      preferences
    } = req.body;

    // Validate required fields with helpful messages
    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('Full Name');
    if (!email || !email.trim()) missingFields.push('Email');
    if (!password || !password.trim()) missingFields.push('Password');
    if (!phone || !phone.trim()) missingFields.push('Phone Number');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in all required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., example@domain.com)',
        field: 'email'
      });
    }

    // Validate password length
    if (password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        field: 'password'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\(\)\.\+]+$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Phone number can only contain numbers and formatting characters (spaces, hyphens, parentheses, dots, or +). Letters are not allowed.',
        field: 'phone'
      });
    }
    
    // Check phone number length
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be between 7 and 15 digits',
        field: 'phone'
      });
    }

    // Check if email already exists
    const emailLower = email.trim().toLowerCase();
    if (userCredentials.has(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already registered. Please use a different email or try logging in instead.',
        field: 'email',
        suggestion: 'If this is your account, please use the login page instead.'
      });
    }

    // Generate new user ID
    const maxId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) : 0;
    const newId = maxId + 1;

    // Create new user object
    const newUser = {
      id: newId,
      name: name.trim(),
      email: emailLower,
      phone: phone.trim(),
      address: address ? address.trim() : '',
      preferences: preferences || '',
      preferencesArray: preferences ? preferences.split(',').map(p => p.trim()).filter(p => p) : []
    };

    // Hash and store password in credentials map
    const hashedPassword = await hashPassword(password.trim());
    userCredentials.set(emailLower, hashedPassword);
    saveCredentials();

    // Add to users array
    users.push(newUser);
    saveUsers();

    // Return user data without password
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser
    });
  } catch (error) {
    logError(error, {
      method: 'registerUser',
      email: req.body?.email,
      error: error.message
    });
    
    // Provide more helpful error messages based on error type
    if (error.code === 'ENOENT' || error.message.includes('file')) {
      return res.status(500).json({
        success: false,
        message: 'Unable to save your account. Please try again in a moment. If the problem persists, contact support.'
      });
    }
    
    if (error.message.includes('password') || error.message.includes('hash')) {
      return res.status(500).json({
        success: false,
        message: 'There was an issue processing your password. Please try again with a different password.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'We encountered an issue creating your account. Please check your information and try again. If the problem continues, contact support.'
    });
  }
};

/**
 * Login for registered users/customers
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const emailLower = email.trim().toLowerCase();
    const storedPassword = userCredentials.get(emailLower);

    // Check if email exists
    if (!storedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password (handles both hashed and plain text for backward compatibility)
    const passwordMatch = await comparePassword(password.trim(), storedPassword);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // If password was plain text, hash it now for future logins (migration)
    if (!isPasswordHashed(storedPassword)) {
      const hashedPassword = await hashPassword(password.trim());
      userCredentials.set(emailLower, hashedPassword);
      saveCredentials();
    }

    // Find the user by email
    const user = users.find(u => u.email.toLowerCase() === emailLower);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      type: 'user'
    });

    // Return user data with token (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: user,
      token: token
    });
  } catch (error) {
    logError(error, 'loginUser');
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.'
    });
  }
};

/**
 * Update a user's profile
 */
export const updateUser = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      name,
      email,
      phone,
      address,
      preferences
    } = req.body;

    // Get existing user
    const existingUser = users[userIndex];
    
    // Update only provided fields (allow partial updates)
    const updatedUser = {
      ...existingUser,
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone: phone.trim() }),
      ...(address !== undefined && { address: address ? address.trim() : '' }),
      ...(preferences !== undefined && { 
        preferences: preferences || '',
        preferencesArray: preferences ? preferences.split(',').map(p => p.trim()).filter(p => p) : []
      })
    };

    // Update the user in the array
    users[userIndex] = updatedUser;
    saveUsers();

    // If email changed, update credentials map key (but keep same password hash)
    if (email && email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const oldEmail = existingUser.email.toLowerCase();
      const newEmail = email.trim().toLowerCase();
      if (userCredentials.has(oldEmail)) {
        const passwordHash = userCredentials.get(oldEmail);
        userCredentials.delete(oldEmail);
        userCredentials.set(newEmail, passwordHash);
        saveCredentials();
      }
    }

    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logError(error, 'updateUser');
    res.status(500).json({
      success: false,
      message: 'Error updating user profile. Please try again.'
    });
  }
};
