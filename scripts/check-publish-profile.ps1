# Check and set up Azure publish profile
# This script helps get the publish profile from Azure and set it up in GitHub

# Configuration
$ResourceGroup = "lookbook-rg"
$WebAppName = "lookbook-nextjs-app"

Write-Host "Checking for Azure publish profile for $WebAppName..." -ForegroundColor Green

# Check if Azure CLI is installed
try {
    $azVersion = az --version
    Write-Host "Azure CLI is installed." -ForegroundColor Green
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

# Get the publish profile
Write-Host "Getting publish profile for $WebAppName..."
$publishProfilePath = "publish_profile.xml"
az webapp deployment list-publishing-profiles --resource-group $ResourceGroup --name $WebAppName --xml > $publishProfilePath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get publish profile. Please check if the web app exists and you have proper permissions." -ForegroundColor Red
    exit 1
}

# Check if the file was created
if (-not (Test-Path $publishProfilePath)) {
    Write-Host "Failed to save publish profile." -ForegroundColor Red
    exit 1
}

Write-Host "Publish profile downloaded to $publishProfilePath" -ForegroundColor Green

# Instructions for GitHub Actions
Write-Host "`nInstructions for GitHub Actions:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository"
Write-Host "2. Navigate to Settings > Secrets and variables > Actions"
Write-Host "3. Click on 'New repository secret'"
Write-Host "4. Name: AZURE_WEBAPP_PUBLISH_PROFILE"
Write-Host "5. Value: [Copy and paste the entire content of $publishProfilePath]"
Write-Host "6. Click 'Add secret'"

# To test local deployment
Write-Host "`nTo deploy locally using the publish profile:" -ForegroundColor Cyan
Write-Host "1. Run: .\scripts\deploy-to-azure.ps1"

Write-Host "`nPublish profile process completed!" -ForegroundColor Green 