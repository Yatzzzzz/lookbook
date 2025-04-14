# Comprehensive Next.js deployment script for Azure Web App
Write-Host "Deploying Next.js application to Azure Web App" -ForegroundColor Green

# Set variables
$resourceGroup = "lookbook-rg"
$webAppName = "lookbook-nextjs-app"
$deployZipPath = "nextjs-deployment.zip"
$tempDir = "temp-deploy-nextjs"

# Create temp directory
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Create optimized server.js file for Azure
$serverJs = @'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// For debugging
console.log(`Starting server... Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`PORT environment variable: ${process.env.PORT || 'not set'}`);

try {
  // Azure Web App expects port 8080
  const port = process.env.PORT || 8080;
  
  // Bind to all interfaces (important for Azure)
  const hostname = '0.0.0.0';
  
  // Development mode or production mode
  const dev = process.env.NODE_ENV !== 'production';
  
  // Initialize Next.js
  console.log('Initializing Next.js app...');
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  
  // Prepare Next.js
  app.prepare()
    .then(() => {
      console.log('Next.js app prepared successfully');
      
      // Create HTTP server
      const server = createServer((req, res) => {
        try {
          // Parse URL
          const parsedUrl = parse(req.url, true);
          
          // Log incoming request
          console.log(`Incoming request: ${req.method} ${parsedUrl.pathname}`);
          
          // Let Next.js handle the request
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
      
      // Handle server errors
      server.on('error', (err) => {
        console.error('Server error:', err);
      });
      
      // Start listening
      server.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('Server is now running!');
      });
    })
    .catch((err) => {
      console.error('Error preparing Next.js app:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Fatal error initializing app:', err);
  process.exit(1);
}
'@

# Create startup script
$startupScript = @'
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
'@

# Create simplified package.json that points to the server.js file
$packageJson = @'
{
  "name": "lookbook-nextjs-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "next": "15.2.4",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
'@

# Create simple next.config.js with fixes for Azure
$nextConfig = @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
'@

# Save files to temp directory
Set-Content -Path "$tempDir/server.js" -Value $serverJs -Encoding UTF8
Set-Content -Path "$tempDir/startup.sh" -Value $startupScript -Encoding UTF8
Set-Content -Path "$tempDir/package.json" -Value $packageJson -Encoding UTF8
Set-Content -Path "$tempDir/next.config.js" -Value $nextConfig -Encoding UTF8

# Create a simple HTML page to verify the site works
$indexHtml = @'
<!DOCTYPE html>
<html>
<head>
  <title>Next.js App - Azure Deployment</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #0078D4; }
    h2 { color: #333; margin-top: 30px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .container { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Next.js App - Azure Deployment</h1>
    <p>If you see this page, the web server is successfully installed but
    the Next.js application has not started yet.</p>
    
    <h2>What's Next?</h2>
    <p>Check the server logs to see why the Next.js application is not starting.</p>
  </div>
</body>
</html>
'@

# Create public directory and add index.html
New-Item -Path "$tempDir/public" -ItemType Directory -Force | Out-Null
Set-Content -Path "$tempDir/public/index.html" -Value $indexHtml -Encoding UTF8

# Create zip file
if (Test-Path $deployZipPath) {
    Remove-Item $deployZipPath -Force
}
Compress-Archive -Path "$tempDir/*" -DestinationPath $deployZipPath -Force

# Deploy to Azure
Write-Host "Deploying to Azure Web App..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $resourceGroup --name $webAppName --src $deployZipPath

if ($LASTEXITCODE -eq 0) {
    # Update app settings
    Write-Host "Updating app settings..." -ForegroundColor Yellow
    az webapp config appsettings set --resource-group $resourceGroup --name $webAppName --settings PORT=8080 NODE_ENV=production
    
    # Set startup command
    Write-Host "Configuring startup command..." -ForegroundColor Yellow
    az webapp config set --resource-group $resourceGroup --name $webAppName --startup-file "startup.sh"
    
    # Set permissions
    Write-Host "Setting permissions for startup script..." -ForegroundColor Yellow
    az webapp ssh --resource-group $resourceGroup --name $webAppName --command "chmod +x /home/site/wwwroot/startup.sh" 2>$null
    
    # Restart the web app
    Write-Host "Restarting web app..." -ForegroundColor Yellow
    az webapp restart --name $webAppName --resource-group $resourceGroup
    
    # Cleanup
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Host "Deployment complete. Your Next.js app should be available at: https://$webAppName.azurewebsites.net" -ForegroundColor Green
    Write-Host "Note: It may take a few minutes for the app to fully start." -ForegroundColor Yellow
} else {
    Write-Host "Deployment failed. Please check the error messages above." -ForegroundColor Red
} 