-- Set up tables for Lookbook application

-- Create users table (extends the auth.users table)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create looks table (for fashion posts)
CREATE TABLE IF NOT EXISTS looks (
  look_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Looks table policies
ALTER TABLE looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view all looks" 
  ON looks FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own looks" 
  ON looks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own looks" 
  ON looks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own looks" 
  ON looks FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for fashion look images
-- Note: Execute this part in the Supabase dashboard or with the Supabase API
-- 1. Create a new bucket called "looks"
-- 2. Set it to public or configure appropriate access policies 