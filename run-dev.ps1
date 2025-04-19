# PowerShell script to run the Next.js app on Windows
# This avoids the '&&' operator which isn't supported in basic PowerShell

# Change to the lookbook directory
Set-Location C:\lookbook

# Run the dev server
Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
npm run dev 