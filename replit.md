# Merlin - The Oracle

## Overview
An astrological guide application built with Next.js 14, featuring personal astrology calculations and visualizations.

## Tech Stack
- **Framework**: Next.js 14.2.15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **Animations**: Framer Motion
- **Authentication**: Clerk (configured but not fully integrated)
- **Database ORM**: Prisma (configured but no schema present)
- **Astrology Libraries**: astronomia, sweph (Swiss Ephemeris)
- **Visualization**: D3.js

## Project Structure
```
app/           - Next.js app router pages and layouts
components/    - React components
hooks/         - Custom React hooks
lib/           - Utility functions and shared code
types/         - TypeScript type definitions
tests/         - Jest test files
docs/          - Documentation
```

## Development
- **Dev Server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Start Production**: `npm run start`
- **Lint**: `npm run lint`
- **Tests**: `npm run test`

## Environment Variables
The project uses the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string (configured via Replit)
- Clerk authentication keys may be needed if auth features are used

## Recent Changes
- 2025-12-27: Configured for Replit environment
  - Updated Next.js to run on port 5000 with host 0.0.0.0
  - Added cache control headers in next.config.js
  - Installed Python for sweph native module compilation
