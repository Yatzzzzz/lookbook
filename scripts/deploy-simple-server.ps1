# Simple Azure Deployment Script for Test Server
Write-Host "Deploying Simple Test Server to Azure Web App" -ForegroundColor Green

# Set variables
$resourceGroup = "lookbook-rg"
$webAppName = "lookbook-nextjs-app"
$deployZipPath = "simple-server.zip"

# Create a simple server.js file
$serverJs = @'
// Simple HTTP server for testing Azure Web App deployment
const http = require('http');
const os = require('os');

// Configuration
const port = process.env.PORT || 8080;
const hostname = '0.0.0.0';

// Create server
const server = http.createServer((req, res) => {
  // Basic HTML response
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Azure Web App - Test Server</title>
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
    <h1>Azure Web App - Server Running!</h1>
    <p>This simple test server is running successfully on Azure App Service.</p>
    
    <h2>Server Information</h2>
    <pre>
Node Version: ${process.version}
Server Uptime: ${process.uptime().toFixed(2)} seconds
Hostname: ${os.hostname()}
Platform: ${os.platform()} ${os.release()}
    </pre>
    
    <h2>Environment Variables</h2>
    <pre>
PORT: ${process.env.PORT || 'Not set'}
NODE_ENV: ${process.env.NODE_ENV || 'Not set'}
WEBSITE_HOSTNAME: ${process.env.WEBSITE_HOSTNAME || 'Not set'}
    </pre>
  </div>
</body>
</html>
  `;
  
  // Send response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

// Start server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Node Version: ${process.version}`);
});
'@

# Create a package.json file
$packageJson = @'
{
  "name": "azure-test-server",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
'@

# Create files in a temporary directory
New-Item -Path "temp-deploy" -ItemType Directory -Force | Out-Null
Set-Content -Path "temp-deploy/server.js" -Value $serverJs
Set-Content -Path "temp-deploy/package.json" -Value $packageJson

# Create zip file
Compress-Archive -Path "temp-deploy/*" -DestinationPath $deployZipPath -Force

# Deploy to Azure
Write-Host "Deploying to Azure Web App..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $resourceGroup --name $webAppName --src $deployZipPath

# Update configuration
Write-Host "Configuring Azure Web App..." -ForegroundColor Yellow
az webapp config set --resource-group $resourceGroup --name $webAppName --startup-file "server.js"
az webapp config appsettings set --resource-group $resourceGroup --name $webAppName --settings PORT=8080 NODE_ENV=production

# Restart the web app
Write-Host "Restarting web app..." -ForegroundColor Yellow
az webapp restart --name $webAppName --resource-group $resourceGroup

# Cleanup
Remove-Item -Path "temp-deploy" -Recurse -Force
Write-Host "Deployment completed. Visit https://$webAppName.azurewebsites.net to view your test server." -ForegroundColor Green 