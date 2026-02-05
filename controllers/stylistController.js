import { stylists, stylistCredentials, saveStylists, saveCredentials } from '../utils/dataStore.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';
import { logError, logInfo, logDebug } from '../utils/logger.js';
import { env } from '../config/env.js';
import { generateToken } from '../utils/jwtUtils.js';

/**
 * Get all stylists
 */
export const getAllStylists = (req, res) => {
  try {
    res.json({
      success: true,
      data: stylists,
      count: stylists.length
    });
  } catch (error) {
    logError(error, 'getAllStylists');
    res.status(500).json({
      success: false,
      message: 'Error fetching stylists. Please try again.'
    });
  }
};

/**
 * Get a single stylist by ID
 */
export const getStylistById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const stylist = stylists.find(s => s.id === id);
    
    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }
    
    res.json({
      success: true,
      data: stylist
    });
  } catch (error) {
    logError(error, 'getStylistById');
    res.status(500).json({
      success: false,
      message: 'Error fetching stylist. Please try again.'
    });
  }
};

/**
 * Register a new stylist
 */
export const registerStylist = async (req, res) => {
  try {
    // Parse text fields from form data
    const {
      name,
      email,
      password,
      phone,
      address,
      specialty,
      hairTextureTypes,
      yearsOfExperience,
      rate,
      hours,
      currentAvailability,
      availableNow,
      willingToTravel,
      accommodations,
      lastMinuteBookingsAllowed,
      streetParkingAvailable,
      cancellationPolicy,
      acceptedPaymentTypes,
      services,
      about,
      products
    } = req.body;

    // Handle uploaded files
    const profilePictureFile = req.files?.['profilePicture']?.[0];
    const portfolioFiles = req.files?.['portfolioPictures'] || [];
    
    // Get the base URL from the request (works for both localhost and mobile IP)
    // This ensures images are accessible from the same origin as the request
    const getBaseUrl = () => {
      // Use request host header (most reliable for mobile)
      const host = req.get('host');
      const protocol = req.protocol || (req.secure ? 'https' : 'http');
      
      if (host) {
        return `${protocol}://${host}`;
      }
      
      // Fallback: try to extract from origin/referer
      const origin = req.headers.origin || req.headers.referer;
      if (origin) {
        try {
          const url = new URL(origin);
          return `${url.protocol}//${url.hostname}:${env.PORT}`;
        } catch (e) {
          // Continue to next fallback
        }
      }
      
      // Final fallback: use configured API_BASE_URL
      return env.API_BASE_URL || `http://localhost:${env.PORT}`;
    };
    
    const baseUrl = getBaseUrl();
    
    // Generate URLs for uploaded files
    const profilePictureUrl = profilePictureFile 
      ? `${baseUrl}/uploads/profiles/${profilePictureFile.filename}`
      : null;
    
    const portfolioUrls = portfolioFiles.map(file => 
      `${baseUrl}/uploads/portfolio/${file.filename}`
    );

    // Validate required fields (including password)
    if (!name || !email || !password || !phone || !address || !specialty || !hairTextureTypes || 
        !yearsOfExperience || !rate || !hours || !currentAvailability || 
        !willingToTravel || !about) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'email', 'password', 'phone', 'address', 'specialty', 'hairTextureTypes', 
                   'yearsOfExperience', 'rate', 'hours', 'currentAvailability', 
                   'willingToTravel', 'about']
      });
    }

    // Check if email already exists
    const emailLower = email.trim().toLowerCase();
    if (stylistCredentials.has(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email or log in.'
      });
    }

    // Generate new ID (find max ID and add 1)
    const maxId = stylists.length > 0 ? Math.max(...stylists.map(s => s.id)) : 0;
    const newId = maxId + 1;

    // Parse services if it's a JSON string
    let parsedServices = [];
    if (services) {
      try {
        parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
      } catch (e) {
        parsedServices = [];
      }
    }

    // Parse hair texture types
    let parsedHairTextureTypes = '';
    if (hairTextureTypes) {
      parsedHairTextureTypes = typeof hairTextureTypes === 'string' 
        ? hairTextureTypes 
        : (Array.isArray(hairTextureTypes) ? hairTextureTypes.join(', ') : '');
    }

    // Parse accepted payment types
    let parsedAcceptedPaymentTypes = '';
    if (acceptedPaymentTypes) {
      parsedAcceptedPaymentTypes = typeof acceptedPaymentTypes === 'string'
        ? acceptedPaymentTypes
        : (Array.isArray(acceptedPaymentTypes) ? acceptedPaymentTypes.join(', ') : '');
    }

    // Create new stylist object matching the data structure
    const newStylist = {
      id: newId,
      name: name ? name.trim() : '',
      profilePicture: profilePictureUrl || `https://i.pravatar.cc/200?img=${newId}`,
      address: address.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      rate: rate.trim(),
      hours: hours.trim(),
      currentAvailability: currentAvailability.trim(),
      availableNow: availableNow === true || availableNow === 'true' || false,
      willingToTravel: willingToTravel.trim(),
      yearsOfExperience: yearsOfExperience.trim(),
      specialty: specialty.trim(),
      hairTextureTypes: parsedHairTextureTypes,
      accommodations: accommodations ? accommodations.trim() : '',
      lastMinuteBookingsAllowed: lastMinuteBookingsAllowed || '',
      streetParkingAvailable: streetParkingAvailable || '',
      cancellationPolicy: cancellationPolicy || '',
      acceptedPaymentTypes: parsedAcceptedPaymentTypes,
      services: Array.isArray(parsedServices) && parsedServices.length > 0
        ? parsedServices.filter(s => s.name && s.name.trim()).map(service => {
            const serviceObj = {
              name: service.name.trim(),
              duration: service.duration ? service.duration.trim() : ''
            };
            if (service.price && service.price.trim()) {
              serviceObj.price = service.price.trim();
            }
            return serviceObj;
          })
        : [],
      about: about ? about.trim() : '',
      portfolio: portfolioUrls.length > 0
        ? portfolioUrls
        : [],
      products: Array.isArray(products) && products.length > 0
        ? products
        : []
    };

    // Hash and store password in credentials map
    const hashedPassword = await hashPassword(password.trim());
    stylistCredentials.set(emailLower, hashedPassword);
    saveCredentials();

    // Add to stylists array
    stylists.push(newStylist);
    saveStylists();

    // Note: password is stored in stylistCredentials map, not in stylist object
    res.status(201).json({
      success: true,
      message: 'Stylist registered successfully',
      data: newStylist // Password is not included in stylist object
    });
  } catch (error) {
    logError(error, 'registerStylist');
    res.status(500).json({
      success: false,
      message: 'Error registering stylist. Please try again.'
    });
  }
};

/**
 * Login for registered stylists
 */
export const loginStylist = async (req, res) => {
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
    const storedPassword = stylistCredentials.get(emailLower);

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
      stylistCredentials.set(emailLower, hashedPassword);
      saveCredentials();
    }

    // Find the stylist by email
    const stylist = stylists.find(s => s.email.toLowerCase() === emailLower);

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist account not found'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: stylist.id,
      email: stylist.email,
      type: 'stylist'
    });

    // Return stylist data with token (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: stylist,
      token: token
    });
  } catch (error) {
    logError(error, 'loginStylist');
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.'
    });
  }
};

/**
 * Update a stylist's profile
 */
export const updateStylist = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    logDebug(`PUT /api/stylists/${id} - Updating stylist profile`, { body: req.body });
    
    const stylistIndex = stylists.findIndex(s => s.id === id);
    
    if (stylistIndex === -1) {
      logDebug(`Stylist with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }
    
    logDebug(`Found stylist at index ${stylistIndex}`, { name: stylists[stylistIndex].name });

    const {
      name,
      email,
      phone,
      address,
      profilePicture,
      specialty,
      hairTextureTypes,
      yearsOfExperience,
      rate,
      hours,
      currentAvailability,
      availableNow,
      willingToTravel,
      accommodations,
      lastMinuteBookingsAllowed,
      streetParkingAvailable,
      cancellationPolicy,
      acceptedPaymentTypes,
      services,
      about,
      portfolio,
      products
    } = req.body;

    // Get existing stylist
    const existingStylist = stylists[stylistIndex];
    
    // Update only provided fields (allow partial updates)
    const updatedStylist = {
      ...existingStylist,
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone: phone.trim() }),
      ...(address && { address: address.trim() }),
      ...(profilePicture && { profilePicture }),
      ...(specialty && { specialty: specialty.trim() }),
      ...(hairTextureTypes !== undefined && { 
        hairTextureTypes: typeof hairTextureTypes === 'string' 
          ? hairTextureTypes.trim() 
          : (Array.isArray(hairTextureTypes) ? hairTextureTypes.join(', ') : existingStylist.hairTextureTypes)
      }),
      ...(yearsOfExperience && { yearsOfExperience: yearsOfExperience.trim() }),
      ...(rate && { rate: rate.trim() }),
      ...(hours && { hours: hours.trim() }),
      ...(currentAvailability && { currentAvailability: currentAvailability.trim() }),
      ...(availableNow !== undefined && { availableNow: availableNow === true || availableNow === 'true' }),
      ...(willingToTravel && { willingToTravel: willingToTravel.trim() }),
      ...(accommodations !== undefined && { accommodations: accommodations ? accommodations.trim() : '' }),
      ...(lastMinuteBookingsAllowed !== undefined && { lastMinuteBookingsAllowed: lastMinuteBookingsAllowed || '' }),
      ...(streetParkingAvailable !== undefined && { streetParkingAvailable: streetParkingAvailable || '' }),
      ...(cancellationPolicy !== undefined && { cancellationPolicy: cancellationPolicy || '' }),
      ...(acceptedPaymentTypes !== undefined && {
        acceptedPaymentTypes: typeof acceptedPaymentTypes === 'string'
          ? acceptedPaymentTypes.trim()
          : (Array.isArray(acceptedPaymentTypes) ? acceptedPaymentTypes.join(', ') : existingStylist.acceptedPaymentTypes)
      }),
      ...(services !== undefined && {
        services: Array.isArray(services) && services.length > 0
          ? services.filter(s => s.name && s.name.trim()).map(service => {
              const serviceObj = {
                name: service.name.trim(),
                duration: service.duration ? service.duration.trim() : ''
              };
              if (service.price && service.price.trim()) {
                serviceObj.price = service.price.trim();
              }
              return serviceObj;
            })
          : []
      }),
      ...(about !== undefined && { about: about ? about.trim() : '' }),
      ...(portfolio !== undefined && {
        portfolio: Array.isArray(portfolio) ? portfolio : []
      }),
      ...(products !== undefined && {
        products: Array.isArray(products) ? products : []
      })
    };

    // Update the stylist in the array
    stylists[stylistIndex] = updatedStylist;
    saveStylists();

    // If email changed, update credentials map key (but keep same password hash)
    if (email && email.trim().toLowerCase() !== existingStylist.email.toLowerCase()) {
      const oldEmail = existingStylist.email.toLowerCase();
      const newEmail = email.trim().toLowerCase();
      if (stylistCredentials.has(oldEmail)) {
        const passwordHash = stylistCredentials.get(oldEmail);
        stylistCredentials.delete(oldEmail);
        stylistCredentials.set(newEmail, passwordHash);
        saveCredentials();
      }
    }

    res.json({
      success: true,
      message: 'Stylist profile updated successfully',
      data: updatedStylist
    });
  } catch (error) {
    logError(error, 'updateStylist');
    res.status(500).json({
      success: false,
      message: 'Error updating stylist profile. Please try again.'
    });
  }
};
