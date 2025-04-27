# Marketplace Features Deployment Script
Write-Host "Starting deployment of Marketplace features (Phase 4)..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Function to check if a command succeeded
function Test-CommandSuccess {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Create marketplace SQL tables in Supabase
Write-Host "`nDeploying marketplace database tables..." -ForegroundColor Yellow
try {
    & .\scripts\deploy-marketplace-features.ps1
    Test-CommandSuccess
    Write-Host "Database tables created successfully." -ForegroundColor Green
} catch {
    Write-Host "Error deploying marketplace database tables: $_" -ForegroundColor Red
    exit 1
}

# Build the application to ensure no errors
Write-Host "`nBuilding application with new marketplace features..." -ForegroundColor Yellow
try {
    npm run build
    Test-CommandSuccess
    Write-Host "Application built successfully." -ForegroundColor Green
} catch {
    Write-Host "Error building application: $_" -ForegroundColor Red
    exit 1
}

# Update the progress file
$progressFile = "Docs/wardrobe/wardrobe progress.txt"
$progressContent = Get-Content -Raw $progressFile

# Add completion date to the progress file
$completionDate = Get-Date -Format "MMMM d, yyyy"
$progressContent = $progressContent -replace "## Next Steps for Phase 4 \(Marketplace Integration\):", "## Marketplace Integration Completed on $completionDate"

# Write the updated content back to the file
$progressContent | Set-Content $progressFile
Write-Host "Updated progress documentation with completion date" -ForegroundColor Green

# Start the application
Write-Host "`nStarting application..." -ForegroundColor Yellow
Write-Host "The application will start in development mode. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host "`nMarketplace features have been successfully deployed! You can now access the marketplace at:" -ForegroundColor Green
Write-Host "http://localhost:3000/marketplace" -ForegroundColor Cyan

# Start the app
npm run dev 