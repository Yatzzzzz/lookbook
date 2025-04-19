-- Remove RLS from look_ratings table to allow all users to create and update ratings
-- This script addresses the issue where gallery ratings fail with: "Error loading images: Failed to save rating: new row violates row-level security policy for table "look_ratings""

-- First, drop the existing policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON look_ratings;
DROP POLICY IF EXISTS "Users can only create/update their own ratings" ON look_ratings;

-- Now disable row level security completely on the look_ratings table
ALTER TABLE look_ratings DISABLE ROW LEVEL SECURITY;

-- Verify status (will show 'f' for RLS disabled)
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'look_ratings';

-- Create a more permissive policy as fallback if RLS cannot be completely disabled
-- This policy allows all operations for everyone
CREATE POLICY "Allow all operations on look_ratings" 
ON look_ratings FOR ALL 
USING (true);

-- Row Level Security has been disabled for look_ratings table 