# PowerShell script to install dependencies and run the remove-dark-theme script

# Navigate to the project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

# Check if glob is installed
$globInstalled = npm list --depth=0 glob 2>$null
if (-not $?) {
    Write-Host "Installing glob package..."
    npm install --save-dev glob
} else {
    Write-Host "glob package is already installed."
}

# Run the script
Write-Host "Running dark theme removal script..."
node src/scripts/remove-dark-theme.js

Write-Host "Done! The dark theme has been removed from the codebase."
Write-Host "Please run 'npm run dev' to see the changes in the browser." 