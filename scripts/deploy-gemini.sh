#!/bin/bash
# Gemini Deployment Script for Linux/Mac
# This script builds and deploys the application to Azure Static Web Apps

# Exit on error
set -e

# Banner
echo -e "\e[96m========================================="
echo -e "   Gemini Multimodal Chat Deployment   "
echo -e "=========================================\e[0m"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo -e "\e[32m✅ .env.local file found.\e[0m"
else
  echo -e "\e[31m❌ .env.local file not found. Please create it and add GEMINI_API_KEY before deploying.\e[0m"
  exit 1
fi

# Check if GEMINI_API_KEY is set in .env.local
if grep -q "GEMINI_API_KEY=" ".env.local"; then
  API_KEY=$(grep "GEMINI_API_KEY=" ".env.local" | cut -d '=' -f2)
  if [ ${#API_KEY} -gt 5 ]; then
    echo -e "\e[32m✅ GEMINI_API_KEY found in .env.local\e[0m"
  else
    echo -e "\e[31m❌ GEMINI_API_KEY appears to be too short or invalid.\e[0m"
    exit 1
  fi
else
  echo -e "\e[31m❌ GEMINI_API_KEY not found in .env.local file. Please add it before deploying.\e[0m"
  exit 1
fi

# Check if swa-cli.config.json exists
if [ -f "swa-cli.config.json" ]; then
  echo -e "\e[32m✅ Azure Static Web App configuration found.\e[0m"
else
  echo -e "\e[31m❌ swa-cli.config.json not found. Please run 'swa init' to configure your static web app.\e[0m"
  exit 1
fi

# Test Gemini connectivity before deployment
echo -e "\e[96m📡 Testing Gemini API connectivity...\e[0m"
if node scripts/test-gemini.js; then
  echo -e "\e[32m✅ Gemini API connectivity confirmed.\e[0m"
else
  echo -e "\e[31m❌ Gemini API connectivity check failed. Please check your API key and try again.\e[0m"
  exit 1
fi

# Verify Azure Static Web App config has the appropriate CORS settings for audio
echo -e "\e[96m🔍 Checking Azure CORS configuration for audio/microphone support...\e[0m"
if [ -f "staticwebapp.config.json" ]; then
  if grep -q "\"cors\"" "staticwebapp.config.json" && grep -q "\"allowedOrigins\"" "staticwebapp.config.json" && grep -q "\"*\"" "staticwebapp.config.json"; then
    echo -e "\e[32m✅ CORS configuration for audio appears to be correctly set.\e[0m"
  else
    echo -e "\e[33m⚠️ CORS configuration may need updating for audio functionality.\e[0m"
    echo -e "\e[33m   Consider adding the following to staticwebapp.config.json:\e[0m"
    echo -e "\e[33m   \"cors\": { \"allowedOrigins\": [\"*\"] }\e[0m"
  fi
else
  echo -e "\e[33m⚠️ staticwebapp.config.json not found. CORS settings for audio might be needed.\e[0m"
fi

# Build the application
echo -e "\e[96m🔨 Building application...\e[0m"
if npm run build; then
  echo -e "\e[32m✅ Build completed successfully.\e[0m"
else
  echo -e "\e[31m❌ Build failed. Please check the error messages above.\e[0m"
  exit 1
fi

# Deploy to Azure Static Web Apps
echo -e "\e[96m🚀 Deploying to Azure Static Web Apps...\e[0m"
if swa deploy; then
  echo -e "\e[32m✅ Deployment completed successfully.\e[0m"
else
  echo -e "\e[31m❌ Deployment failed. Please check the error messages above.\e[0m"
  exit 1
fi

# Success message
echo ""
echo -e "\e[32m🎉 Gemini multimodal chat feature has been successfully deployed!\e[0m"
echo -e "\e[32m   - Text, image, and audio inputs are now supported\e[0m"
echo -e "\e[32m   - Speech synthesis is available for spoken responses\e[0m"
echo ""
echo -e "\e[96mVisit your Azure Static Web App URL to access the application.\e[0m"
echo -e "\e[33mDon't forget to add the GEMINI_API_KEY to your Azure Static Web App Configuration.\e[0m"
echo ""

# Browser support notification
echo -e "\e[96m📱 Browser Support Information:\e[0m"
echo -e "   - Google Chrome: Best support for all features"
echo -e "   - Microsoft Edge: Good support, may require permissions setup"
echo -e "   - Firefox: Support varies for speech recognition"
echo -e "   - Safari: Limited support for speech features"
echo "" 