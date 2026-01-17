import express from 'express';
import cors from 'cors';
import { stylists } from './data/stylists.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
  console.log(`  GET /health - Health check`);
});
