import { users, userCredentials, saveUsers, saveCredentials } from '../utils/dataStore.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';

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

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'email', 'password', 'phone']
      });
    }

    // Check if email already exists
    const emailLower = email.trim().toLowerCase();
    if (userCredentials.has(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email or log in.'
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
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
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

    // Return user data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: user
    });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
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
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};
