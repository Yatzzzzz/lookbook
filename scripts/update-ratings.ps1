# PowerShell script to update all ratings in the database
# This is intended to be run on a Windows system with PowerShell

param (
    [string]$Supabase_URL = $env:SUPABASE_URL,
    [string]$Supabase_Key = $env:SUPABASE_SERVICE_KEY,
    [switch]$Force = $false
)

# Verify parameters are set
if (-not $Supabase_URL -or -not $Supabase_Key) {
    Write-Host "Error: Missing Supabase URL or service key." -ForegroundColor Red
    Write-Host "Please set environment variables SUPABASE_URL and SUPABASE_SERVICE_KEY," -ForegroundColor Red
    Write-Host "or provide them as parameters:" -ForegroundColor Red
    Write-Host "./update-ratings.ps1 -Supabase_URL 'https://your-project.supabase.co' -Supabase_Key 'your-service-key'" -ForegroundColor Red
    exit 1
}

# Check for the Force flag
if (-not $Force) {
    Write-Host "This script will update all ratings in the database." -ForegroundColor Yellow
    Write-Host "It should be run in a controlled environment, as it will affect all rating data." -ForegroundColor Yellow
    Write-Host "Run with -Force to skip this warning and proceed." -ForegroundColor Yellow
    exit 0
}

Write-Host "Starting rating synchronization..." -ForegroundColor Cyan

# SQL script to execute
$sql = @"
-- Create a temporary table to store rating statistics
CREATE TEMP TABLE IF NOT EXISTS temp_rating_stats AS
SELECT 
  look_id,
  COUNT(*) AS rating_count,
  AVG(rating)::NUMERIC(3,2) AS avg_rating
FROM look_ratings
GROUP BY look_id;

-- Update the looks table with the calculated statistics
UPDATE looks l
SET 
  rating_count = trs.rating_count,
  avg_rating = trs.avg_rating,
  updated_at = NOW()
FROM temp_rating_stats trs
WHERE l.look_id = trs.look_id;

-- Reset all top_rated flags
UPDATE looks 
SET feature_in = array_remove(feature_in, 'top_rated');

-- Add top_rated flag to the top 50 rated looks (with minimum 5 ratings)
WITH top_rated AS (
    SELECT look_id
    FROM looks
    WHERE rating_count >= 5
    ORDER BY avg_rating DESC, rating_count DESC
    LIMIT 50
)
UPDATE looks
SET feature_in = array_append(feature_in, 'top_rated')
FROM top_rated
WHERE looks.look_id = top_rated.look_id;

-- Get stats about how many records were updated
SELECT 
  COUNT(*) AS total_looks,
  COUNT(*) FILTER (WHERE rating_count > 0) AS rated_looks,
  ROUND(AVG(rating_count) FILTER (WHERE rating_count > 0)) AS avg_ratings_per_look,
  MAX(rating_count) AS max_ratings_on_look,
  COUNT(*) FILTER (WHERE feature_in @> ARRAY['top_rated']) AS top_rated_count
FROM looks;
"@

# Create temporary SQL file
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$sql | Out-File -FilePath $tempFile -Encoding utf8

try {
    # Construct the curl command
    $curlCommand = "curl -X POST '$Supabase_URL/rest/v1/rpc/exec_sql' -H 'apikey: $Supabase_Key' -H 'Authorization: Bearer $Supabase_Key' -H 'Content-Type: application/json' -d '{`"sql_query`": `"$(($sql -replace '"', '\"') -replace "'", "''") `"}'"

    # Execute the command
    Write-Host "Executing SQL script..." -ForegroundColor Cyan
    $result = Invoke-Expression $curlCommand

    # Parse and display results
    try {
        $jsonResult = $result | ConvertFrom-Json
        
        Write-Host "Ratings update completed successfully!" -ForegroundColor Green
        Write-Host "Results:" -ForegroundColor Cyan
        Write-Host "  Total looks: $($jsonResult[0].total_looks)" -ForegroundColor White
        Write-Host "  Rated looks: $($jsonResult[0].rated_looks)" -ForegroundColor White
        Write-Host "  Average ratings per look: $($jsonResult[0].avg_ratings_per_look)" -ForegroundColor White
        Write-Host "  Maximum ratings on a look: $($jsonResult[0].max_ratings_on_look)" -ForegroundColor White
        Write-Host "  Top rated looks: $($jsonResult[0].top_rated_count)" -ForegroundColor White
    }
    catch {
        Write-Host "Error parsing results. Raw output:" -ForegroundColor Red
        Write-Host $result
    }
}
catch {
    Write-Host "Error executing SQL script: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Clean up temporary file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

Write-Host "Rating synchronization complete." -ForegroundColor Green 