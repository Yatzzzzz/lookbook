#!/bin/bash

# Log startup
echo "Starting Azure deployment script at $(date)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Ensure dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/next" ]; then
  echo "Installing dependencies..."
  npm install --no-audit --no-fund
fi

# Start the server
echo "Starting the server..."
NODE_ENV=production node server.js 