# PowerShell script to deploy social features SQL scripts
# This script will run the SQL files needed to set up our social features

# Set the base directory to the root of the project
$baseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Get the supabase token and URL from .env.local
$envFile = Join-Path $baseDir ".env.local"
$envContent = Get-Content $envFile

# Extract SUPABASE_URL and SUPABASE_SERVICE_ROLE
$supabaseUrl = ($envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=(.*)" } | ForEach-Object { $matches[1] })
$supabaseKey = ($envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)" } | ForEach-Object { $matches[1] })
$supabaseServiceKey = ($envContent | Where-Object { $_ -match "SUPABASE_SERVICE_ROLE_KEY=(.*)" } | ForEach-Object { $matches[1] })

if (-not $supabaseUrl -or -not $supabaseServiceKey) {
    Write-Error "Could not find Supabase URL or service key in .env.local"
    exit 1
}

# SQL files to run
$sqlFiles = @(
    "supabase/create-social-tables.sql", 
    "supabase/create-popular-users-function.sql"
)

# Loop through each SQL file and run it using the Supabase API
foreach ($sqlFile in $sqlFiles) {
    $fullPath = Join-Path $baseDir $sqlFile
    if (Test-Path $fullPath) {
        Write-Host "Running SQL file: $sqlFile"
        $sqlContent = Get-Content -Raw $fullPath
        
        # Execute the SQL using Supabase REST API
        $headers = @{
            "apikey" = $supabaseServiceKey
            "Authorization" = "Bearer $supabaseServiceKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            "query" = $sqlContent
        } | ConvertTo-Json
        
        $endpoint = "$supabaseUrl/rest/sql"
        
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body
            Write-Host "Successfully executed $sqlFile"
        }
        catch {
            Write-Error "Failed to execute $sqlFile: $_"
            Write-Error $_.Exception.Response.Content
        }
    }
    else {
        Write-Error "SQL file not found: $fullPath"
    }
}

Write-Host "Social features database setup completed!" 