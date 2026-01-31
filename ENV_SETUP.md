# Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Restart the server:**
   ```bash
   npm start
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production`, `test` |
| `PORT` | Server port | `3001` |
| `API_BASE_URL` | Base URL for API (used in file URLs) | `http://localhost:3001` or `https://api.yourdomain.com` |
| `FRONTEND_URL` | Frontend URL(s) for CORS | `http://localhost:5173` or `https://yourdomain.com` |

### Optional Variables (with defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_PROFILE_PICTURE_SIZE` | Max profile picture size in bytes | `5242880` (5MB) |
| `MAX_PORTFOLIO_PICTURE_SIZE` | Max portfolio image size in bytes | `10485760` (10MB) |
| `MAX_FILE_SIZE` | Global max file size in bytes | `10485760` (10MB) |
| `MAX_REQUEST_BODY_SIZE` | Max request body size in bytes | `52428800` (50MB) |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Login rate limit window in milliseconds | `900000` (15 minutes) |
| `LOGIN_RATE_LIMIT_MAX` | Max login attempts per window | `5` |
| `REGISTRATION_RATE_LIMIT_WINDOW_MS` | Registration rate limit window in milliseconds | `3600000` (1 hour) |
| `REGISTRATION_RATE_LIMIT_MAX` | Max registrations per window | `3` |
| `GENERAL_RATE_LIMIT_WINDOW_MS` | General API rate limit window in milliseconds | `900000` (15 minutes) |
| `GENERAL_RATE_LIMIT_MAX` | Max requests per window for all endpoints | `100` |

## Development Setup

For local development, use these values in your `.env`:

```env
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

## Production Setup

For production, use these values:

```env
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Important:** In production, `API_BASE_URL` and `FRONTEND_URL` are **required**. The server will exit if they are not set.

## Multiple Frontend Origins

If you need to allow multiple frontend origins (e.g., staging and production), separate them with commas:

```env
FRONTEND_URL=https://staging.yourdomain.com,https://yourdomain.com
```

## File Size Limits

File size limits are specified in **bytes**. Common conversions:

- 1MB = 1,048,576 bytes
- 5MB = 5,242,880 bytes
- 10MB = 10,485,760 bytes
- 50MB = 52,428,800 bytes

## Rate Limiting

Rate limiting helps protect your API from abuse and brute force attacks. All limits are configurable via environment variables:

### Login Rate Limiting
- **Purpose**: Prevents brute force attacks on login endpoints
- **Default**: 5 attempts per 15 minutes
- **Applies to**: `/api/users/login`, `/api/stylists/login`

### Registration Rate Limiting
- **Purpose**: Prevents spam account creation
- **Default**: 3 registrations per hour
- **Applies to**: `/api/users` (POST), `/api/stylists` (POST)

### General API Rate Limiting
- **Purpose**: Baseline protection for all endpoints
- **Default**: 100 requests per 15 minutes
- **Applies to**: All API endpoints

### Rate Limit Configuration

Time windows are specified in **milliseconds**. Common conversions:

- 1 minute = 60,000 ms
- 15 minutes = 900,000 ms
- 1 hour = 3,600,000 ms
- 1 day = 86,400,000 ms

When a rate limit is exceeded, the API returns a `429 Too Many Requests` status with a message indicating when to retry.

## Security Notes

1. **Never commit `.env` to version control** - It's already in `.gitignore`
2. **Use `.env.example` as a template** - Commit this file with example values
3. **Keep production `.env` secure** - Store it securely on your production server
4. **Rotate secrets regularly** - If you add API keys or secrets later

## Troubleshooting

### Server won't start in production

If you see an error about missing environment variables, make sure:
- `API_BASE_URL` is set
- `FRONTEND_URL` is set
- Both are valid URLs

### CORS errors

If you're getting CORS errors:
1. Check that `FRONTEND_URL` matches your frontend's origin exactly
2. In development, localhost origins are automatically allowed
3. For multiple origins, separate them with commas (no spaces around commas)

### File upload errors

If file uploads are failing:
1. Check file size limits in `.env`
2. Ensure limits are specified in bytes
3. Check server logs for specific error messages

## Example .env File

```env
# Development Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# File Upload Limits (in bytes)
MAX_PROFILE_PICTURE_SIZE=5242880
MAX_PORTFOLIO_PICTURE_SIZE=10485760
MAX_FILE_SIZE=10485760

# Request Body Size Limit (in bytes)
MAX_REQUEST_BODY_SIZE=52428800

# Rate Limiting Configuration
# Login: 5 attempts per 15 minutes
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=5

# Registration: 3 attempts per hour
REGISTRATION_RATE_LIMIT_WINDOW_MS=3600000
REGISTRATION_RATE_LIMIT_MAX=3

# General API: 100 requests per 15 minutes
GENERAL_RATE_LIMIT_WINDOW_MS=900000
GENERAL_RATE_LIMIT_MAX=100
```
