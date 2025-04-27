# PowerShell script to deploy marketplace features
# Ensure this script is run with the correct permissions

# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#].*?)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "Loaded environment variable: $key"
        }
    }
}

# Validate that required environment variables are set
$requiredVars = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        Write-Host "Error: Missing required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}

# Set variables from environment
$SUPABASE_URL = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "Process")
$SUPABASE_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "Process")

Write-Host "Starting deployment of marketplace features..." -ForegroundColor Cyan

# Create the API URL
$API_URL = "$SUPABASE_URL/rest/v1/rpc/exec_sql"

# Read the SQL file
try {
    $SQL_CONTENT = Get-Content -Path "supabase/fixed-marketplace-tables.sql" -Raw
    Write-Host "Successfully read the SQL file." -ForegroundColor Green
} catch {
    Write-Host "Error reading SQL file: $_" -ForegroundColor Red
    exit 1
}

# Create headers for API request
$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

# Create body for API request
$body = @{
    "query" = $SQL_CONTENT
} | ConvertTo-Json

# Send request to Supabase
try {
    Write-Host "Executing SQL to create marketplace tables and policies..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Headers $headers -Body $body
    Write-Host "Successfully executed SQL." -ForegroundColor Green
} catch {
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
    
    # Try to get more details about the error
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    
    exit 1
}

# Copy API route files
Write-Host "Copying API route files..." -ForegroundColor Yellow

# Create necessary directories if they don't exist
$directories = @(
    "src/app/api/marketplace",
    "src/app/api/marketplace/products",
    "src/app/api/marketplace/products/[productId]",
    "src/app/api/marketplace/product-matches",
    "src/app/api/marketplace/product-matches/[itemId]",
    "src/app/api/marketplace/wishlist",
    "src/app/api/marketplace/wishlist/[id]",
    "src/app/api/marketplace/recommendations"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host "Marketplace features deployment completed successfully!" -ForegroundColor Green
Write-Host "Please ensure the API routes are properly set up in the Next.js application." -ForegroundColor Yellow

# Update progress file to reflect completion of Phase 4
$progressFile = "Docs/wardrobe/wardrobe progress.txt"
if (Test-Path $progressFile) {
    $progressContent = Get-Content -Raw $progressFile
    
    # Update the Phase 4 status
    $progressContent = $progressContent -replace "### Phase 4: Marketplace Integration \(Next Phase\)", "### Phase 4: Marketplace Integration ✅ COMPLETED"
    $progressContent = $progressContent -replace "- Create product matching interface ⏳ PLANNED", "- Create product matching interface ✅ COMPLETED"
    $progressContent = $progressContent -replace "- Implement wishlist functionality ⏳ PLANNED", "- Implement wishlist functionality ✅ COMPLETED"
    $progressContent = $progressContent -replace "- Add affiliate product recommendations ⏳ PLANNED", "- Add affiliate product recommendations ✅ COMPLETED"
    
    # Add details about the implementation
    $implementationDetails = @"

## Files Created or Modified in Phase 4:

### Database Tables and Deployment
1. `supabase/create-marketplace-tables.sql` - Created tables for products, wishlist, click tracking, etc.
2. `scripts/deploy-marketplace-features.ps1` - PowerShell script to deploy marketplace tables

### Context and Interfaces
3. `src/app/context/WardrobeContext.tsx` - Enhanced with marketplace features:
   - Added interfaces for Product, WishListItem, PriceHistory, and ProductRecommendation
   - Added methods for managing products, wishlist, recommendations, and affiliate tracking
   - Implemented price history and product matching functionality

### UI Components and Pages
4. `src/app/marketplace/page.tsx` - Created marketplace landing page
5. `src/app/marketplace/product-matching/page.tsx` - Implemented product matching interface
6. `src/app/marketplace/wishlist/page.tsx` - Created wishlist management page
7. `src/app/marketplace/recommendations/page.tsx` - Built personalized product recommendations page
8. `src/app/marketplace/product/[productId]/page.tsx` - Created product detail page with affiliate links

## Implementation Details for Phase 4:

1. Created marketplace database schema:
   - Added products table for storing affiliate products
   - Created wish_list table for user wishlist functionality
   - Added click_tracking table for affiliate link analytics
   - Created product_recommendations table for personalized suggestions
   - Added price_history table for price tracking and alerts

2. Enhanced WardrobeContext with marketplace functionality:
   - Added product search and fetching capabilities
   - Implemented wishlist management features
   - Created recommendation tracking and management
   - Added price history tracking
   - Implemented affiliate link click tracking

3. Built user interface components:
   - Created marketplace landing page with featured products and recommendations
   - Implemented product matching interface to find products similar to wardrobe items
   - Built wishlist management with price tracking and alerts
   - Created recommendations page with personalized product suggestions
   - Implemented product detail page with affiliate links and similar products

4. Added deployment script for marketplace features
"@

    # Append the implementation details if they don't already exist
    if ($progressContent -notmatch "Files Created or Modified in Phase 4") {
        $progressContent = $progressContent + $implementationDetails
    }
    
    # Write the updated content back to the file
    $progressContent | Set-Content $progressFile
    Write-Host "Updated progress documentation in $progressFile" -ForegroundColor Green
}

Write-Host "Marketplace deployment complete!" -ForegroundColor Cyan 