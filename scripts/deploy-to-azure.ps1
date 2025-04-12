# Deploy to Azure PowerShell script
# This script helps with building and deploying the app to Azure

# Configuration
$ResourceGroup = "lookbook-rg"
$WebAppName = "lookbook-nextjs-app"

Write-Host "Starting deployment process for $WebAppName..." -ForegroundColor Green

# Step 1: Build the application
Write-Host "Step 1: Building the application..." -ForegroundColor Cyan

# Create .env.local file with necessary environment variables
if (-not (Test-Path .env.local)) {
    Write-Host "Creating .env.local file..."
    @"
CI=true
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://wwjuohjstrcyvshfuadr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GOOGLE_APPLICATION_CREDENTIALS=./dummy-credentials.json
NEXT_PUBLIC_WEBSOCKET_URL=wss://lookbook-nextjs-app.azurewebsites.net/api/gemini-live
"@ | Out-File -FilePath .env.local -Encoding utf8
    Write-Host "Created .env.local file. Please edit it to add your actual API keys." -ForegroundColor Yellow
}

# Create dummy credentials file for building
if (-not (Test-Path dummy-credentials.json)) {
    Write-Host "Creating dummy-credentials.json..."
    "{}" | Out-File -FilePath dummy-credentials.json -Encoding utf8
}

# Install dependencies
Write-Host "Installing dependencies..."
npm ci --legacy-peer-deps

# Build the application
Write-Host "Building the application..."
$env:CI = "true"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

# Step 2: Package the application
Write-Host "Step 2: Packaging the application..." -ForegroundColor Cyan

# Create a zip file for deployment
Write-Host "Creating deployment package..."
Compress-Archive -Path * -DestinationPath release.zip -Force -Exclude @("node_modules/*", ".git/*", "release.zip")

# Step 3: Deploy to Azure
Write-Host "Step 3: Deploying to Azure..." -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $azVersion = az --version
    Write-Host "Azure CLI is installed. Version: $azVersion" -ForegroundColor Green
}
catch {
    Write-Host "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Login to Azure
Write-Host "Logging in to Azure..."
az login

# Check if login was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to login to Azure. Please try again." -ForegroundColor Red
    exit 1
}

# Deploy the application
Write-Host "Deploying application to $WebAppName..."
az webapp deployment source config-zip --resource-group $ResourceGroup --name $WebAppName --src release.zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed. Please check the error messages and try again." -ForegroundColor Red
    exit 1
}

# Step 4: Verify deployment
Write-Host "Step 4: Verifying deployment..." -ForegroundColor Cyan

# Get the URL of the web app
$url = "https://$WebAppName.azurewebsites.net"
Write-Host "Application deployed to: $url" -ForegroundColor Green

# Test the deployment
Write-Host "Testing deployment..."
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "Deployment verification successful! Status code: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "Failed to verify deployment. Status code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "The application might still be starting up. Please check the URL manually in a few minutes." -ForegroundColor Yellow
}

Write-Host "Deployment process completed!" -ForegroundColor Green
Write-Host "You can access your application at: $url" -ForegroundColor Cyan 