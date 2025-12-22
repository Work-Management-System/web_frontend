# Frontend Environment Variables Setup Guide

This document explains how to set up environment variables for the Next.js frontend application.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` file and fill in all the required values

3. Make sure `.env.local` is in your `.gitignore` file (Next.js ignores it by default)

## Required Environment Variables

### API Configuration
- `NEXT_PUBLIC_API_BASE_URL` - **REQUIRED** - Backend API base URL (e.g., "https://api.manazeit.com/api/v1")
- `NEXT_PUBLIC_BACKEND_URL` - Optional - Backend URL for Socket.io (defaults to API_BASE_URL without /api/v1)

## Environment File Priority

Next.js loads environment variables in this order (later files override earlier ones):
1. `.env`
2. `.env.local` (ignored by git)
3. `.env.development` / `.env.production` (based on NODE_ENV)
4. `.env.development.local` / `.env.production.local`

**Note:** Files with `.local` suffix are ignored by git and should be used for local development.

## Example Configurations

### Local Development
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:9003/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:9003
```

### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://api.manazeit.com/api/v1
NEXT_PUBLIC_BACKEND_URL=https://api.manazeit.com
```

## Important Notes

1. **NEXT_PUBLIC_ prefix is required** - Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
2. **Never commit `.env.local`** - This file contains your local configuration
3. **Use `.env.example`** - Commit this file as a template for other developers
4. **Restart dev server** - After changing `.env` files, restart your Next.js dev server

## Validation

The application will throw errors if required environment variables are missing:
- `axiosInstance.ts` will throw an error if `NEXT_PUBLIC_API_BASE_URL` is not set
- `SocketConnection.ts` will warn if backend URL is not configured

## Troubleshooting

If API calls fail:
1. Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Verify the URL format (should include `/api/v1` for API calls)
3. Check browser console for errors
4. Restart the Next.js dev server after updating `.env` files

