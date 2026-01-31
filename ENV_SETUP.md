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
```
