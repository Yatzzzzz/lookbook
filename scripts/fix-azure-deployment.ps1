# Simple script to fix Azure deployment issues
Write-Host "Fixing Azure Web App deployment issues" -ForegroundColor Green

# Set variables
$resourceGroup = "lookbook-rg"
$webAppName = "lookbook-nextjs-app"
$deployZipPath = "azure-fix.zip"
$tempDir = "temp-fix"

# Create temp directory
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Create a fixed server.js file
$serverJs = @'
// Simple server.js file for Azure Web App
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const port = process.env.PORT || 8080;
const hostname = '0.0.0.0';

// Log startup info
console.log(`Starting server on port ${port}`);
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Simple server that serves static files from public directory
const server = createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Serve index.html for root path
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error loading index.html');
        return;
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    });
    return;
  }
  
  // Serve static files from public directory
  const filePath = path.join(__dirname, 'public', req.url);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File not found, return 404
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    
    // Determine content type
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    if (filePath.endsWith('.css')) contentType = 'text/css';
    if (filePath.endsWith('.js')) contentType = 'text/javascript';
    if (filePath.endsWith('.json')) contentType = 'application/json';
    if (filePath.endsWith('.png')) contentType = 'image/png';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    
    // Stream the file
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
'@

# Create startup script
$startupScript = @'
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
'@

# Create a simple index.html file
$indexHtml = @'
<!DOCTYPE html>
<html>
<head>
  <title>Azure Web App - Fixed Server</title>
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
    <h1>Fixed Azure Web App Server</h1>
    <p>This is a temporary page while the main application is being fixed.</p>
    
    <h2>Deployment Information</h2>
    <p>This page is served by a simple Node.js server running on Azure Web App.</p>
    <p>Once the main application is properly configured, this page will be replaced.</p>
  </div>
</body>
</html>
'@

# Save files to temp directory
Set-Content -Path "$tempDir/server.js" -Value $serverJs -Encoding UTF8
Set-Content -Path "$tempDir/startup.sh" -Value $startupScript -Encoding UTF8

# Create public directory and add index.html
New-Item -Path "$tempDir/public" -ItemType Directory -Force | Out-Null
Set-Content -Path "$tempDir/public/index.html" -Value $indexHtml -Encoding UTF8

# Create package.json
$packageJson = @'
{
  "name": "azure-web-app-fix",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
'@
Set-Content -Path "$tempDir/package.json" -Value $packageJson -Encoding UTF8

# Create zip file
if (Test-Path $deployZipPath) {
    Remove-Item $deployZipPath -Force
}
Compress-Archive -Path "$tempDir/*" -DestinationPath $deployZipPath -Force

# Deploy to Azure
Write-Host "Deploying fix to Azure Web App..." -ForegroundColor Yellow
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
    
    Write-Host "Deployment complete. Your fixed server should be available at: https://$webAppName.azurewebsites.net" -ForegroundColor Green
    Write-Host "Note: It may take a few minutes for the app to fully start." -ForegroundColor Yellow
} else {
    Write-Host "Deployment failed. Please check the error messages above." -ForegroundColor Red
} 