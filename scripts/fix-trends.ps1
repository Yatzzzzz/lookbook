# PowerShell script to fix trends page data issues
# This updates the necessary database tables and fixes ratings counts

param (
    [string]$Supabase_URL = $env:NEXT_PUBLIC_SUPABASE_URL,
    [string]$Supabase_Key = $env:SUPABASE_SERVICE_ROLE_KEY
)

if (-not $Supabase_URL -or -not $Supabase_Key) {
    Write-Host "Error: Missing required Supabase credentials" -ForegroundColor Red
    Write-Host "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables or provide them as parameters" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting trends data fix script..." -ForegroundColor Cyan

# SQL query to run, including all necessary fixes
$sql = @"
-- Run the top rated flags update function
DO $$
BEGIN
    -- Create the function if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_top_rated_flags') THEN
        CREATE OR REPLACE FUNCTION update_top_rated_flags()
        RETURNS VOID AS $$
        BEGIN
            -- Reset all flags first
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
        END;
        $$ LANGUAGE plpgsql;
    END IF;

    -- Run the update function
    PERFORM update_top_rated_flags();
END $$;

-- Fix any data inconsistencies
-- Ensure rating_count is correct
UPDATE looks l
SET rating_count = COALESCE(c.count, 0)
FROM (
    SELECT look_id, COUNT(*) as count
    FROM look_ratings
    GROUP BY look_id
) c
WHERE l.look_id = c.look_id;

-- Ensure avg_rating is correct
UPDATE looks l
SET avg_rating = COALESCE(c.avg, 0)
FROM (
    SELECT look_id, AVG(rating)::NUMERIC(3,2) as avg
    FROM look_ratings
    GROUP BY look_id
) c
WHERE l.look_id = c.look_id;

-- Make sure feature_in is an array if it's null
UPDATE looks 
SET feature_in = ARRAY['gallery']
WHERE feature_in IS NULL;

-- Update all triggers
DO $$
BEGIN
    -- Recreate look_rating trigger function
    CREATE OR REPLACE FUNCTION update_look_rating_stats()
    RETURNS TRIGGER AS $$
    DECLARE
        look_id_val UUID;
        rating_count_val INTEGER;
        avg_rating_val NUMERIC(3,2);
    BEGIN
        -- Determine which look_id to update
        IF (TG_OP = 'DELETE') THEN
            look_id_val := OLD.look_id;
        ELSE
            look_id_val := NEW.look_id;
        END IF;
        
        IF look_id_val IS NULL THEN
            RETURN NULL;
        END IF;
        
        -- Calculate new rating statistics for this look
        SELECT 
            COUNT(*) AS rating_count,
            COALESCE(AVG(rating)::NUMERIC(3,2), 0) AS avg_rating
        INTO rating_count_val, avg_rating_val
        FROM look_ratings
        WHERE look_id = look_id_val;
        
        -- Update the looks table with new statistics with proper WHERE clause
        UPDATE looks
        SET 
            rating_count = rating_count_val,
            avg_rating = avg_rating_val,
            rating = avg_rating_val::TEXT
        WHERE look_id = look_id_val;
        
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    -- Recreate the trigger
    DROP TRIGGER IF EXISTS update_look_rating_stats_trigger ON look_ratings;
    CREATE TRIGGER update_look_rating_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON look_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_look_rating_stats();

END $$;

-- Fix RLS policies for look_ratings table
DO $$
BEGIN
    -- First, ensure RLS is enabled (but handled properly)
    ALTER TABLE look_ratings ENABLE ROW LEVEL SECURITY;
    
    -- Drop any existing policies
    DROP POLICY IF EXISTS "Anyone can view ratings" ON look_ratings;
    DROP POLICY IF EXISTS "Users can only create/update their own ratings" ON look_ratings;
    DROP POLICY IF EXISTS "Allow all operations on look_ratings" ON look_ratings;
    DROP POLICY IF EXISTS "Authenticated users can rate" ON look_ratings;
    DROP POLICY IF EXISTS "Users can update their own ratings" ON look_ratings;
    DROP POLICY IF EXISTS "Users can delete their own ratings" ON look_ratings;
    DROP POLICY IF EXISTS "Service role can manage all ratings" ON look_ratings;
    
    -- Create properly scoped policies
    -- 1. Anyone can view ratings
    CREATE POLICY "Anyone can view ratings" 
    ON look_ratings FOR SELECT 
    USING (true);
    
    -- 2. Authenticated users can rate (insert/update)
    CREATE POLICY "Authenticated users can rate" 
    ON look_ratings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    -- 3. Users can update their own ratings
    CREATE POLICY "Users can update their own ratings" 
    ON look_ratings FOR UPDATE 
    USING (auth.uid() = user_id);
    
    -- 4. Users can delete their own ratings
    CREATE POLICY "Users can delete their own ratings" 
    ON look_ratings FOR DELETE 
    USING (auth.uid() = user_id);
    
    -- Service role bypass
    CREATE POLICY "Service role can manage all ratings" 
    ON look_ratings
    USING (auth.jwt() ->> 'role' = 'service_role');
END $$;

-- Get stats about what has been fixed
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

    # Display results
    Write-Host "Script execution complete!" -ForegroundColor Green
    Write-Host "Results:" -ForegroundColor Cyan
    $result | ConvertFrom-Json | Format-Table

    # Additional information
    Write-Host "The trends page should now show top rated looks correctly." -ForegroundColor Green
    Write-Host "If issues persist, please check the browser console for any errors." -ForegroundColor Yellow
} catch {
    Write-Host "Error executing script: $_" -ForegroundColor Red
} finally {
    # Clean up
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
} 