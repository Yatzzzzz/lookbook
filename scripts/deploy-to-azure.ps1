# Deploy to Azure Web App script for Windows PowerShell
Write-Host "Deploying to Azure Web App - lookbook-nextjs-app" -ForegroundColor Green

# Check if Azure CLI is installed
$azCliCheck = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCliCheck) {
    Write-Host "Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows" -ForegroundColor Red
    exit 1
}

# Login to Azure if not already logged in
az account show -o none
if ($LASTEXITCODE -ne 0) {
    Write-Host "Logging in to Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to login to Azure. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Set variables and paths
$resourceGroup = "lookbook-rg"
$webAppName = "lookbook-nextjs-app"
$rootPath = (Get-Item -Path $PSScriptRoot).Parent.FullName
$simpleServerJsPath = Join-Path -Path $PSScriptRoot -ChildPath "simple-server.js"
$deployZipPath = Join-Path -Path $rootPath -ChildPath "deploy-fix.zip"

# Prepare files for deployment
Write-Host "Preparing files for deployment..." -ForegroundColor Yellow
Write-Host "Root path: $rootPath" -ForegroundColor Cyan

# Check if simple-server.js exists
if (-not (Test-Path $simpleServerJsPath)) {
    Write-Host "Error: simple-server.js not found at path: $simpleServerJsPath" -ForegroundColor Red
    exit 1
}

# Create a temp directory for minimal deployment package
$tempDir = Join-Path -Path $rootPath -ChildPath "temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory | Out-Null

# Copy simple-server.js to the temp directory as server.js
Copy-Item -Path $simpleServerJsPath -Destination (Join-Path -Path $tempDir -ChildPath "server.js")

# Create a minimal package.json
$minimalPackageJson = @{
    name = "azure-diagnostic-app"
    version = "1.0.0"
    private = $true
    main = "server.js"
    scripts = @{
        start = "node server.js"
    }
    engines = @{
        node = ">=20.0.0"
    }
}

# Write the minimal package.json to the temp directory
$minimalPackageJsonPath = Join-Path -Path $tempDir -ChildPath "package.json"
$minimalPackageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $minimalPackageJsonPath -Encoding utf8

# Create startup script for Linux environment
$startupShContent = @'
#!/bin/bash
echo "Starting deployment setup script..."
cd /home/site/wwwroot

# Log environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Files in directory: $(ls -la)"

# Start the server
echo "Starting server..."
export NODE_ENV=production
export PORT=8080
node server.js
'@

$startupShPath = Join-Path -Path $tempDir -ChildPath "startup.sh"
[System.IO.File]::WriteAllText($startupShPath, $startupShContent.Replace("`r`n", "`n"))

# Create deployment zip file
if (Test-Path $deployZipPath) {
    Remove-Item $deployZipPath -Force
}

# Create zip file with deployment package
Write-Host "Creating server fix package..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $deployZipPath -Force

# Verify the zip file was created
if (-not (Test-Path $deployZipPath)) {
    Write-Host "Error: Failed to create deployment zip file at path: $deployZipPath" -ForegroundColor Red
    exit 1
}

# Deploy to Azure
Write-Host "Deploying test server to Azure Web App..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $resourceGroup --name $webAppName --src $deployZipPath

if ($LASTEXITCODE -eq 0) {
    # Update app settings to ensure the correct port
    Write-Host "Updating app settings..." -ForegroundColor Yellow
    az webapp config appsettings set --resource-group $resourceGroup --name $webAppName --settings PORT=8080 NODE_ENV=production

    # Configure startup command to use our startup.sh script
    Write-Host "Configuring startup command..." -ForegroundColor Yellow
    az webapp config set --resource-group $resourceGroup --name $webAppName --startup-file "startup.sh"

    # Make the startup.sh file executable
    Write-Host "Making startup script executable..." -ForegroundColor Yellow
    az webapp ssh --resource-group $resourceGroup --name $webAppName --command "chmod +x /home/site/wwwroot/startup.sh" 2>$null

    # Restart the web app
    Write-Host "Restarting web app..." -ForegroundColor Yellow
    az webapp restart --name $webAppName --resource-group $resourceGroup

    # Get the URL of the deployed app
    $webAppUrl = "https://$webAppName.azurewebsites.net"
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "Your test server is available at: $webAppUrl" -ForegroundColor Green
} else {
    Write-Host "Deployment failed. Please check the error messages above." -ForegroundColor Red
}

# Clean up temp directory
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
} 