@echo off
echo ================================================
echo Supabase Schema Fix for Wardrobe Description Column
echo ================================================
echo.
echo This batch file will guide you through fixing the schema issue.
echo.
echo Steps to fix the issue:
echo 1. Log in to your Supabase dashboard (https://supabase.com)
echo 2. Go to your project
echo 3. Navigate to the SQL Editor
echo 4. Copy and paste the SQL below:
echo.
echo ---------------------------------------------
type wardrobe-schema-fix.sql
echo ---------------------------------------------
echo.
echo 5. Click "Run" to execute the SQL
echo 6. After execution, refresh your app and try again
echo.
echo If you need to update the RLS policies, also run:
echo.
echo ---------------------------------------------
type wardrobe-storage-rls.sql
echo ---------------------------------------------
echo.
pause 