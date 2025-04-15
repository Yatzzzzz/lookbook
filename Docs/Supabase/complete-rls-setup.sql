-- COMPREHENSIVE SUPABASE SETUP FOR LOOKBOOK APP
-- This script sets up all necessary tables and RLS policies

-- =============== USERS TABLE ===============
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can create users" ON users;

-- Create proper RLS policies for users table
-- 1. Allow anyone to view user profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON users FOR SELECT 
USING (true);

-- 2. Allow authenticated users to create their own profile
CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- 4. For new sign-ups, we need a special policy that allows the service role to insert users
CREATE POLICY "Service role can create users" 
ON users FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============== LOOKS TABLE ===============
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

-- =============== STORAGE BUCKETS ===============
-- Create storage bucket for look images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('looks', 'looks', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing storage policies
DROP POLICY IF EXISTS "Public can read from looks bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to looks bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in looks bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in looks bucket" ON storage.objects;

-- Set up RLS policies for storage buckets
-- Allow anyone to read from the looks bucket
CREATE POLICY "Public can read from looks bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'looks');

-- Allow authenticated users to insert their own files
CREATE POLICY "Authenticated users can upload to looks bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'looks' AND
  auth.uid() IS NOT NULL
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files in looks bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'looks' AND
  auth.uid() = owner
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files in looks bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'looks' AND
  auth.uid() = owner
); 