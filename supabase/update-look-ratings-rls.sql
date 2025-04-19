-- Update RLS for look_ratings table to fix authentication issues
-- This script addresses the issue where ratings fail with: "Error loading images: Failed to save rating: You must be logged in to rate looks"

-- First, ensure RLS is enabled
ALTER TABLE look_ratings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON look_ratings;
DROP POLICY IF EXISTS "Users can only create/update their own ratings" ON look_ratings;
DROP POLICY IF EXISTS "Allow all operations on look_ratings" ON look_ratings;

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

-- For testing purposes, create a fallback policy that allows the service role to bypass RLS
-- (This should be removed in production if not needed)
CREATE POLICY "Service role can manage all ratings" 
ON look_ratings
USING (auth.jwt() ->> 'role' = 'service_role');

-- To check if these policies are in effect, run:
-- SELECT * FROM pg_policies WHERE tablename = 'look_ratings';