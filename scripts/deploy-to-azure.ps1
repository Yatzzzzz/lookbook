# Script to deploy Next.js app to Azure Web App
# Requirements: 
# - Azure CLI installed and logged in
# - Node.js and npm installed

# Parameters
param(
    [string]$WebAppName = "lookbook-dev-app",
    [string]$ResourceGroup = "LookbookDev"
)

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if required tools are installed
if (-not (Test-CommandExists "az")) {
    Write-Host "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "npm is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Azure CLI login status
$loginStatus = az account show --query name -o tsv 2>$null
if (-not $loginStatus) {
    Write-Host "You are not logged in to Azure CLI. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host "Logged in to Azure as: $loginStatus" -ForegroundColor Green

# Verify the web app exists
$webAppExists = az webapp show --name $WebAppName --resource-group $ResourceGroup --query name -o tsv 2>$null
if (-not $webAppExists) {
    Write-Host "Web App '$WebAppName' not found in resource group '$ResourceGroup'" -ForegroundColor Red
    exit 1
}

Write-Host "Found Web App: $WebAppName" -ForegroundColor Green

# Build the Next.js app
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful" -ForegroundColor Green

# Create a deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Create a temp directory for the deployment package
$tempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy necessary files to temp directory
Copy-Item -Path ".next" -Destination "$tempDir/.next" -Recurse
Copy-Item -Path "public" -Destination "$tempDir/public" -Recurse
Copy-Item -Path "package.json" -Destination "$tempDir/package.json"
# Don't copy package-lock.json to allow fresh install on the server
Copy-Item -Path "server.js" -Destination "$tempDir/server.js"
Copy-Item -Path "web.config" -Destination "$tempDir/web.config"
Copy-Item -Path "middleware.ts" -Destination "$tempDir/middleware.ts" -ErrorAction SilentlyContinue
Copy-Item -Path "next.config.js" -Destination "$tempDir/next.config.js"

# Add deployment script
$deploymentScript = @"
@echo off
echo Installing dependencies...
call npm install --production
echo Starting the application...
"@
Set-Content -Path "$tempDir/deploy.cmd" -Value $deploymentScript

# Create startup script
$startupScript = @"
# This is the startup script for Azure Web App
export NODE_ENV=production
npm start
"@
Set-Content -Path "$tempDir/startup.sh" -Value $startupScript

# Create a ZIP file
$zipFile = "$tempDir.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile

Write-Host "Deployment package created at: $zipFile" -ForegroundColor Green

# Set SCM_DO_BUILD_DURING_DEPLOYMENT to ensure npm install runs on deployment
az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroup --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy to Azure Web App
Write-Host "Deploying to Azure Web App: $WebAppName..." -ForegroundColor Yellow
az webapp deploy --resource-group $ResourceGroup --name $WebAppName --src-path $zipFile --type zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed. Please check the errors and try again." -ForegroundColor Red
    exit 1
}

# Clean up temporary files
Remove-Item -Path $tempDir -Recurse -Force
Remove-Item -Path $zipFile -Force

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your application is now available at: https://$WebAppName.azurewebsites.net" -ForegroundColor Cyan

# Ensure WebSockets are enabled
Write-Host "Enabling WebSockets for real-time features..." -ForegroundColor Yellow
az webapp config set --name $WebAppName --resource-group $ResourceGroup --web-sockets-enabled true

Write-Host "Deployment process complete!" -ForegroundColor Green 