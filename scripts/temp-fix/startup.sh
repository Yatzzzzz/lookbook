#!/bin/bash
echo "Starting deployment script..."
cd /home/site/wwwroot

# Log environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Start the server
echo "Starting server..."
export NODE_ENV=production
export PORT=8080
node server.js
