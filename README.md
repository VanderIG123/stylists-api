# Stylists API Backend

A Node.js backend API for the stylists application built with Express.

## Features

- **GET /api/stylists** - Returns a list of all stylists
- **GET /api/stylists/:id** - Returns a single stylist by ID
- **GET /health** - Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd stylists-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001` by default.

### API Endpoints

#### Get All Stylists
```http
GET /api/stylists
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 13
}
```

#### Get Single Stylist
```http
GET /api/stylists/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sarah Johnson",
    ...
  }
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Project Structure

```
stylists-api/
├── data/
│   └── stylists.js    # Stylists data
├── server.js          # Express server setup
├── package.json       # Dependencies and scripts
├── .gitignore         # Git ignore file
└── README.md          # This file
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## CORS

CORS is enabled by default to allow requests from the frontend application.

## Data

The stylists data is stored in `data/stylists.js` and can be easily modified or replaced with a database integration in the future.
