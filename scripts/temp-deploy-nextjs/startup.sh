#!/bin/bash
echo "Starting Next.js deployment script..."
cd /home/site/wwwroot

# Log environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --omit=dev
fi

# Ensure Next.js is installed
if [ ! -d "node_modules/next" ]; then
  echo "Installing Next.js..."
  npm install next react react-dom
fi

# Set environment variables
export NODE_ENV=production
export PORT=8080

# Start the server
echo "Starting Next.js server..."
node server.js
