# Script to deploy the wardrobe ranking system
# This needs to be run with administrator privileges

# Function to check if supabase is running
function Test-SupabaseRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:54321/rest/v1/" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Path to SQL files
$wardrobeRankingTablesPath = "./supabase/wardrobes-ranking-tables.sql"
$backfillRankingsPath = "./supabase/backfill-wardrobe-rankings.sql"

# Check if files exist
if (-not (Test-Path $wardrobeRankingTablesPath)) {
    Write-Error "Wardrobe ranking tables SQL file not found at $wardrobeRankingTablesPath"
    exit 1
}

if (-not (Test-Path $backfillRankingsPath)) {
    Write-Error "Backfill rankings SQL file not found at $backfillRankingsPath"
    exit 1
}

# Check if Supabase is running
if (-not (Test-SupabaseRunning)) {
    Write-Warning "Supabase doesn't seem to be running. Attempting to start..."
    npx supabase start
    
    # Wait for Supabase to start
    $maxRetries = 5
    $retryCount = 0
    $started = $false
    
    while (-not $started -and $retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 5
        $started = Test-SupabaseRunning
        $retryCount++
        Write-Host "Waiting for Supabase to start... ($retryCount/$maxRetries)"
    }
    
    if (-not $started) {
        Write-Error "Failed to start Supabase. Please start it manually and try again."
        exit 1
    }
}

Write-Host "Supabase is running. Proceeding with deployment..."

# Execute SQL scripts
try {
    Write-Host "Deploying wardrobe ranking tables..."
    npx supabase db execute --file $wardrobeRankingTablesPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to deploy wardrobe ranking tables."
        exit 1
    }
    
    Write-Host "Wardrobe ranking tables deployed successfully."
    
    Write-Host "Backfilling existing wardrobe data..."
    npx supabase db execute --file $backfillRankingsPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to backfill wardrobe rankings."
        exit 1
    }
    
    Write-Host "Wardrobe rankings backfilled successfully."
    
    # Reset the Supabase database to ensure everything is up to date
    Write-Host "Resetting Supabase database to ensure changes are applied..."
    npx supabase db reset
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to reset Supabase database."
        exit 1
    }
    
    Write-Host "Database reset successfully."
    
    Write-Host "Wardrobe ranking system has been successfully deployed!" -ForegroundColor Green
}
catch {
    Write-Error "An error occurred during deployment: $_"
    exit 1
} 