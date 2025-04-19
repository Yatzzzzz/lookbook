# PowerShell script to fix trends by calling the API endpoint directly
# This is a more reliable approach than trying to run SQL directly

param (
    [string]$AppUrl = "http://localhost:3000"
)

Write-Host "Starting trends data fix using API endpoint..." -ForegroundColor Cyan

# Call the fix-trends-direct API endpoint (more reliable)
try {
    $response = Invoke-WebRequest -Uri "$AppUrl/api/fix-trends-direct" -Method Get -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "Successfully called the direct trends fix API" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "API Response: $($result.message)" -ForegroundColor Green
        Write-Host "Updated $($result.updated_looks) looks with ratings" -ForegroundColor Green
        Write-Host "Top rated looks: $($result.top_rated_looks)" -ForegroundColor Green
        
        Write-Host "`nThe trends page should now show top rated looks correctly." -ForegroundColor Cyan
        Write-Host "If issues persist, try the fallback method." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "Direct API call failed with status code: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
        Write-Host "Trying fallback method..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error calling direct trends fix API: $_" -ForegroundColor Red
    Write-Host "Trying fallback method..." -ForegroundColor Yellow
}

# Fallback to the other API endpoint if direct method fails
try {
    $response = Invoke-WebRequest -Uri "$AppUrl/api/fix-trends-data" -Method Get -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "Successfully called the fallback trends fix API" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "API Response: $($result.message)" -ForegroundColor Green
        
        Write-Host "`nThe trends page should now show top rated looks correctly." -ForegroundColor Cyan
    } else {
        Write-Host "Fallback API call failed with status code: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error calling fallback trends fix API: $_" -ForegroundColor Red
    Write-Host "Please ensure your app is running at $AppUrl" -ForegroundColor Yellow
    Write-Host "You can specify a different URL with: ./fix-trends-direct.ps1 -AppUrl 'https://your-app-url.com'" -ForegroundColor Yellow
    exit 1
} 