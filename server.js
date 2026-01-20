import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { stylists } from './data/stylists.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage for stylist credentials (email -> password)
// In production, use a database with hashed passwords (bcrypt)
const stylistCredentials = new Map();

// In-memory storage for user credentials (email -> password)
const userCredentials = new Map();

// In-memory storage for users/customers
const users = [];

// In-memory storage for appointments
const appointments = [];

// Initialize with any existing stylists (for demo purposes)
// In production, credentials would be loaded from a database
stylists.forEach(stylist => {
  // Default password for existing stylists (they should reset it)
  if (!stylistCredentials.has(stylist.email.toLowerCase())) {
    stylistCredentials.set(stylist.email.toLowerCase(), 'default123');
  }
});

// Ensure uploads directories exist
const uploadsDir = join(__dirname, 'uploads');
const profilesDir = join(uploadsDir, 'profiles');
const portfolioDir = join(uploadsDir, 'portfolio');

[uploadsDir, profilesDir, portfolioDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      cb(null, profilesDir);
    } else if (file.fieldname === 'portfolioPictures') {
      cb(null, portfolioDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON payloads (images, portfolio)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Routes

// GET /api/stylists - Get all stylists
app.get('/api/stylists', (req, res) => {
  try {
    res.json({
      success: true,
      data: stylists,
      count: stylists.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stylists',
      error: error.message
    });
  }
});

// GET /api/stylists/:id - Get a single stylist by ID
app.get('/api/stylists/:id', (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Error fetching stylist',
      error: error.message
    });
  }
});

// POST /api/stylists - Register a new stylist
app.post('/api/stylists', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'portfolioPictures', maxCount: 10 }
]), (req, res) => {
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
    
    // Generate URLs for uploaded files
    const profilePictureUrl = profilePictureFile 
      ? `http://localhost:${PORT}/uploads/profiles/${profilePictureFile.filename}`
      : null;
    
    const portfolioUrls = portfolioFiles.map(file => 
      `http://localhost:${PORT}/uploads/portfolio/${file.filename}`
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

    // Store password (in production, hash with bcrypt before storing)
    stylistCredentials.set(emailLower, password.trim());

    // Add to stylists array
    stylists.push(newStylist);

    // Note: In a production app, you'd save to a database
    // For now, this is stored in memory and will reset on server restart
    // Passwords should be hashed with bcrypt in production

    // Note: password is stored in stylistCredentials map, not in stylist object
    res.status(201).json({
      success: true,
      message: 'Stylist registered successfully',
      data: newStylist // Password is not included in stylist object
    });
  } catch (error) {
    console.error('Error registering stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering stylist',
      error: error.message
    });
  }
});

// POST /api/stylists/login - Login for registered stylists
app.post('/api/stylists/login', (req, res) => {
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

    // Check if email exists and password matches
    if (!storedPassword || storedPassword !== password.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Find the stylist by email
    const stylist = stylists.find(s => s.email.toLowerCase() === emailLower);

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist account not found'
      });
    }

    // Return stylist data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: stylist
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// POST /api/users/login - Login for registered users/customers
app.post('/api/users/login', (req, res) => {
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

    // Check if email exists and password matches
    if (!storedPassword || storedPassword !== password.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
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
});

// PUT /api/users/:id - Update a user's profile
app.put('/api/users/:id', (req, res) => {
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

    // If email changed, update credentials map key (but keep same password)
    if (email && email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const oldEmail = existingUser.email.toLowerCase();
      const newEmail = email.trim().toLowerCase();
      if (userCredentials.has(oldEmail)) {
        const password = userCredentials.get(oldEmail);
        userCredentials.delete(oldEmail);
        userCredentials.set(newEmail, password);
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
});

// PUT /api/stylists/:id - Update a stylist's profile
app.put('/api/stylists/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`PUT /api/stylists/${id} - Updating stylist profile`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const stylistIndex = stylists.findIndex(s => s.id === id);
    
    if (stylistIndex === -1) {
      console.log(`Stylist with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }
    
    console.log(`Found stylist at index ${stylistIndex}:`, stylists[stylistIndex].name);

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

    // If email changed, update credentials map key (but keep same password)
    if (email && email.trim().toLowerCase() !== existingStylist.email.toLowerCase()) {
      const oldEmail = existingStylist.email.toLowerCase();
      const newEmail = email.trim().toLowerCase();
      if (stylistCredentials.has(oldEmail)) {
        const password = stylistCredentials.get(oldEmail);
        stylistCredentials.delete(oldEmail);
        stylistCredentials.set(newEmail, password);
      }
    }

    res.json({
      success: true,
      message: 'Stylist profile updated successfully',
      data: updatedStylist
    });
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stylist profile',
      error: error.message
    });
  }
});

// POST /api/users - Register a new user/customer
app.post('/api/users', (req, res) => {
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

    // Store password in credentials map
    userCredentials.set(emailLower, password.trim());

    // Add to users array
    users.push(newUser);

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
});

// POST /api/appointments - Create a new appointment
app.post('/api/appointments', (req, res) => {
  try {
    const {
      stylistId,
      userId,
      purpose,
      date,
      time,
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    if (!stylistId || !purpose || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stylistId, purpose, date, and time are required'
      });
    }

    // Verify stylist exists
    const stylist = stylists.find(s => s.id === parseInt(stylistId));
    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Generate new appointment ID
    const maxId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) : 0;
    const newId = maxId + 1;

    // Create new appointment
    const newAppointment = {
      id: newId,
      stylistId: parseInt(stylistId),
      userId: userId ? parseInt(userId) : null,
      purpose: purpose.trim(),
      date: date.trim(),
      time: time.trim(),
      customerName: customerName ? customerName.trim() : '',
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: newAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

// GET /api/appointments - Get appointments (optionally filtered by userId or stylistId)
app.get('/api/appointments', (req, res) => {
  try {
    const { userId, stylistId } = req.query;
    
    let filteredAppointments = [...appointments];
    
    // Filter by userId if provided
    if (userId) {
      const userIdNum = parseInt(userId);
      filteredAppointments = filteredAppointments.filter(a => a.userId === userIdNum);
    }
    
    // Filter by stylistId if provided
    if (stylistId) {
      const stylistIdNum = parseInt(stylistId);
      filteredAppointments = filteredAppointments.filter(a => a.stylistId === stylistIdNum);
    }
    
    // Sort by date and time (most recent first)
    filteredAppointments.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      data: filteredAppointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/stylists - Get all stylists`);
  console.log(`  GET /api/stylists/:id - Get a single stylist by ID`);
  console.log(`  POST /api/stylists - Register a new stylist`);
  console.log(`  POST /api/stylists/login - Login for stylists`);
  console.log(`  PUT /api/stylists/:id - Update a stylist profile`);
  console.log(`  POST /api/users - Register a new user/customer`);
  console.log(`  POST /api/users/login - Login for users/customers`);
  console.log(`  PUT /api/users/:id - Update a user profile`);
  console.log(`  GET /health - Health check`);
});
