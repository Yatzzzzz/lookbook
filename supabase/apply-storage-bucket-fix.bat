@echo off
echo ================================================
echo Supabase Schema Fix for Missing Storage Columns
echo ================================================
echo.
echo This batch file will guide you through fixing the schema issue.
echo.
echo Steps to fix the issue:
echo 1. Log in to your Supabase dashboard (https://supabase.com)
echo 2. Go to your project
echo 3. Navigate to the SQL Editor
echo.
echo STEP 1: Add missing columns
echo ---------------------------------------------
type add-missing-columns.sql
echo ---------------------------------------------
echo.
echo 4. Click "Run" to execute the SQL above
echo 5. Verify that the columns were added successfully
echo.
echo STEP 2: Update existing records
echo ---------------------------------------------
type update-storage-buckets.sql
echo ---------------------------------------------
echo.
echo 6. Click "Run" to execute the SQL above
echo 7. After execution, refresh your app and try again
echo.
echo ================================================
echo Steps to verify the fix:
echo 1. Check that the "storage_bucket" column exists in the "looks" table
echo 2. Check that existing records in the looks table have proper values:
echo    - Looks used in yaynay should have storage_bucket='yaynay'
echo    - Looks used in battle should have storage_bucket='battle'
echo.
echo 3. For the battle bucket, verify that image files follow the naming convention:
echo    - Each file should be in a username folder (e.g., user_a41c86ee)
echo    - Files should be named: timestamp-type.jpg (e.g., 1745016812247-main.jpg)
echo ================================================
echo.
pause 