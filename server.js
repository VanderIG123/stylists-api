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
  console.log(`  GET /health - Health check`);
});
