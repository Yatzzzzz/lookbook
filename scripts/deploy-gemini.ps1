# Gemini Deployment Script for Windows (PowerShell)
# This script builds and deploys the application to Azure Static Web Apps

# Stop on errors
$ErrorActionPreference = "Stop"

# Banner
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Gemini Multimodal Chat Deployment   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path -Path ".env.local") {
  Write-Host "✅ .env.local file found." -ForegroundColor Green
} else {
  Write-Host "❌ .env.local file not found. Please create it and add GEMINI_API_KEY before deploying." -ForegroundColor Red
  exit 1
}

# Check if GEMINI_API_KEY is set in .env.local
$envContents = Get-Content -Path ".env.local" -Raw
if ($envContents -match "GEMINI_API_KEY=([^\r\n]+)") {
  $apiKey = $matches[1].Trim()
  if ($apiKey.Length -gt 5) {
    Write-Host "✅ GEMINI_API_KEY found in .env.local" -ForegroundColor Green
  } else {
    Write-Host "❌ GEMINI_API_KEY appears to be too short or invalid." -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "❌ GEMINI_API_KEY not found in .env.local file. Please add it before deploying." -ForegroundColor Red
  exit 1
}

# Check if swa-cli.config.json exists
if (Test-Path -Path "swa-cli.config.json") {
  Write-Host "✅ Azure Static Web App configuration found." -ForegroundColor Green
} else {
  Write-Host "❌ swa-cli.config.json not found. Please run 'swa init' to configure your static web app." -ForegroundColor Red
  exit 1
}

# Test Gemini connectivity before deployment
Write-Host "📡 Testing Gemini API connectivity..." -ForegroundColor Cyan
try {
  node scripts/test-gemini.js
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gemini API connectivity check failed. Please check your API key and try again." -ForegroundColor Red
    exit 1
  }
  Write-Host "✅ Gemini API connectivity confirmed." -ForegroundColor Green
} catch {
  Write-Host "❌ Error testing Gemini API connectivity: $_" -ForegroundColor Red
  exit 1
}

# Verify Azure Static Web App config has the appropriate CORS settings for audio
Write-Host "🔍 Checking Azure CORS configuration for audio/microphone support..." -ForegroundColor Cyan
if (Test-Path -Path "staticwebapp.config.json") {
  $swaConfig = Get-Content -Path "staticwebapp.config.json" -Raw | ConvertFrom-Json
  $corsEnabled = $false
  
  if ($swaConfig.PSObject.Properties.Name -contains "cors") {
    if ($swaConfig.cors.PSObject.Properties.Name -contains "allowedOrigins" -and $swaConfig.cors.allowedOrigins -contains "*") {
      $corsEnabled = $true
      Write-Host "✅ CORS configuration for audio appears to be correctly set." -ForegroundColor Green
    }
  }
  
  if (-not $corsEnabled) {
    Write-Host "⚠️ CORS configuration may need updating for audio functionality." -ForegroundColor Yellow
    Write-Host "   Consider adding the following to staticwebapp.config.json:" -ForegroundColor Yellow
    Write-Host '   "cors": { "allowedOrigins": ["*"] }' -ForegroundColor Yellow
  }
} else {
  Write-Host "⚠️ staticwebapp.config.json not found. CORS settings for audio might be needed." -ForegroundColor Yellow
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
try {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
    exit 1
  }
  Write-Host "✅ Build completed successfully." -ForegroundColor Green
} catch {
  Write-Host "❌ Error during build: $_" -ForegroundColor Red
  exit 1
}

# Deploy to Azure Static Web Apps
Write-Host "🚀 Deploying to Azure Static Web Apps..." -ForegroundColor Cyan
try {
  swa deploy
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
  }
  Write-Host "✅ Deployment completed successfully." -ForegroundColor Green
} catch {
  Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
  exit 1
}

# Success message
Write-Host ""
Write-Host "🎉 Gemini multimodal chat feature has been successfully deployed!" -ForegroundColor Green
Write-Host "   - Text, image, and audio inputs are now supported" -ForegroundColor Green
Write-Host "   - Speech synthesis is available for spoken responses" -ForegroundColor Green
Write-Host ""
Write-Host "Visit your Azure Static Web App URL to access the application." -ForegroundColor Cyan
Write-Host "Don't forget to add the GEMINI_API_KEY to your Azure Static Web App Configuration." -ForegroundColor Yellow
Write-Host ""

# Browser support notification
Write-Host "📱 Browser Support Information:" -ForegroundColor Cyan
Write-Host "   - Google Chrome: Best support for all features" -ForegroundColor White
Write-Host "   - Microsoft Edge: Good support, may require permissions setup" -ForegroundColor White
Write-Host "   - Firefox: Support varies for speech recognition" -ForegroundColor White
Write-Host "   - Safari: Limited support for speech features" -ForegroundColor White
Write-Host "" 