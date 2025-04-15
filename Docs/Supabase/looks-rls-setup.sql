-- Create looks table if it doesn't exist
CREATE TABLE IF NOT EXISTS looks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE looks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all looks" ON looks;
DROP POLICY IF EXISTS "Users can insert their own looks" ON looks;
DROP POLICY IF EXISTS "Users can update their own looks" ON looks;
DROP POLICY IF EXISTS "Users can delete their own looks" ON looks;

-- Create RLS policies for looks table
-- 1. Allow anyone to view all looks
CREATE POLICY "Users can view all looks" 
ON looks FOR SELECT 
USING (true);

-- 2. Allow authenticated users to upload their own looks
CREATE POLICY "Users can insert their own looks" 
ON looks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own looks
CREATE POLICY "Users can update their own looks" 
ON looks FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Allow users to delete their own looks
CREATE POLICY "Users can delete their own looks" 
ON looks FOR DELETE 
USING (auth.uid() = user_id); 