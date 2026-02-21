# Production deployment script for DigitalOcean
#!/bin/bash
echo "Building Merlin for production..."
npm run build

echo "Starting production server..."
npm run start
