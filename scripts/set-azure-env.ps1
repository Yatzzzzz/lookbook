# Script to set environment variables from .env.local to Azure Web App
# Requirements: Azure CLI installed and logged in

param(
    [string]$WebAppName = "lookbook-dev-app",
    [string]$ResourceGroup = "LookbookDev",
    [string]$EnvFilePath = ".env.local"
)

# Check if .env.local exists
if (-not (Test-Path $EnvFilePath)) {
    Write-Host "Environment file not found at: $EnvFilePath" -ForegroundColor Red
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

# Read .env.local file and parse environment variables
$envVars = @{}
$content = Get-Content $EnvFilePath
foreach ($line in $content) {
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
        continue
    }

    # Parse key-value pairs
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        # Remove quotes if present
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        
        $envVars[$key] = $value
    }
}

Write-Host "Found $($envVars.Count) environment variables in $EnvFilePath" -ForegroundColor Yellow

# Prepare the settings string for az command
$settings = ""
foreach ($key in $envVars.Keys) {
    # Handle WebSocket URL - replace localhost with Azure URL for production
    if ($key -eq "NEXT_PUBLIC_WEBSOCKET_URL") {
        $value = $envVars[$key].Replace("localhost:3000", "$WebAppName.azurewebsites.net")
        $settings += "$key=$value "
    } else {
        $settings += "$key=$($envVars[$key]) "
    }
    
    Write-Host "Adding: $key" -ForegroundColor Cyan
}

# Set the environment variables in Azure Web App
Write-Host "Setting environment variables in Azure Web App..." -ForegroundColor Yellow
az webapp config appsettings set --resource-group $ResourceGroup --name $WebAppName --settings $settings

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to set environment variables. Please check the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Environment variables set successfully!" -ForegroundColor Green

# Restart the web app to apply the changes
Write-Host "Restarting the web app to apply changes..." -ForegroundColor Yellow
az webapp restart --name $WebAppName --resource-group $ResourceGroup

Write-Host "Web app restarted. Environment variables are now applied." -ForegroundColor Green 