-- sync-users-profiles.sql
-- Purpose: Synchronize users and profiles tables, ensuring consistency and reducing duplication
-- Created: August 2024

-- STEP 1: Create tables if they don't exist
BEGIN;

-- Set search path to public schema to ensure proper access
SET search_path TO public;

-- Ensure role permissions are properly set
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated, anon;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  username TEXT,
  avatar_url TEXT,
  display_name TEXT,
  bio TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Ensure proper ownership and grants
ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE public.users OWNER TO postgres;

GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- STEP 2: Ensure all auth.users have corresponding entries in tables
-- Insert new users
INSERT INTO public.users (id, email, created_at)
SELECT 
  au.id, 
  au.email, 
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Create corresponding profiles
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT 
  u.id, 
  now(), 
  now()
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- STEP 3: Synchronize data between tables
-- Update usernames in profiles where missing
UPDATE public.profiles p
SET username = SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1)
FROM public.users u
WHERE p.id = u.id AND p.username IS NULL;

-- Update display_name fields
-- First in users table
UPDATE public.users u
SET display_name = CASE
  WHEN u.display_name IS NULL OR u.display_name = '' THEN
    COALESCE(u.username, SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1))
  ELSE
    u.display_name
  END
WHERE TRUE;

-- Then synchronize to profiles
UPDATE public.profiles p
SET display_name = u.display_name
FROM public.users u
WHERE p.id = u.id AND (p.display_name IS NULL OR p.display_name = '');

-- Copy avatar_url between tables if one has it and the other doesn't
UPDATE public.profiles p
SET avatar_url = u.avatar_url
FROM public.users u
WHERE p.id = u.id AND u.avatar_url IS NOT NULL AND p.avatar_url IS NULL;

UPDATE public.users u
SET avatar_url = p.avatar_url
FROM public.profiles p
WHERE u.id = p.id AND p.avatar_url IS NOT NULL AND u.avatar_url IS NULL;

-- Copy is_active status
UPDATE public.profiles p
SET is_active = u.is_active
FROM public.users u
WHERE p.id = u.id AND u.is_active IS NOT NULL AND p.is_active IS NULL;

-- STEP 4: Create synchronization trigger
CREATE OR REPLACE FUNCTION public.sync_user_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- When users table is updated
  IF TG_TABLE_NAME = 'users' THEN
    -- Update the corresponding profile
    UPDATE public.profiles
    SET 
      display_name = CASE WHEN NEW.display_name IS NOT NULL THEN NEW.display_name ELSE display_name END,
      username = CASE WHEN NEW.username IS NOT NULL THEN NEW.username ELSE username END,
      avatar_url = CASE WHEN NEW.avatar_url IS NOT NULL THEN NEW.avatar_url ELSE avatar_url END,
      is_active = NEW.is_active,
      updated_at = now()
    WHERE id = NEW.id;
  
  -- When profiles table is updated
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    -- Update the corresponding user
    UPDATE public.users
    SET 
      display_name = CASE WHEN NEW.display_name IS NOT NULL THEN NEW.display_name ELSE display_name END,
      username = CASE WHEN NEW.username IS NOT NULL THEN NEW.username ELSE username END,
      avatar_url = CASE WHEN NEW.avatar_url IS NOT NULL THEN NEW.avatar_url ELSE avatar_url END
    WHERE id = NEW.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure function has proper permissions
ALTER FUNCTION public.sync_user_profile_changes() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.sync_user_profile_changes() TO postgres, service_role;

-- Remove existing triggers if they exist
DROP TRIGGER IF EXISTS user_profile_sync_trigger ON public.users;
DROP TRIGGER IF EXISTS profile_user_sync_trigger ON public.profiles;

-- Create new triggers
CREATE TRIGGER user_profile_sync_trigger
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_changes();

CREATE TRIGGER profile_user_sync_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_changes();

-- STEP 5: Create or replace the unified view
DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  COALESCE(u.display_name, p.display_name) AS display_name,
  COALESCE(u.username, p.username) AS username,
  COALESCE(u.avatar_url, p.avatar_url) AS avatar_url,
  p.bio,
  p.website,
  COALESCE(u.is_active, p.is_active, true) AS is_active,
  u.last_sign_in_at,
  u.created_at,
  p.updated_at
FROM 
  public.users u
JOIN 
  public.profiles p ON u.id = p.id;

-- STEP 6: Set up security
-- Set view ownership and permissions
ALTER VIEW public.user_profiles OWNER TO postgres;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own user record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own user record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- STEP 7: Verify results
SELECT 
  COUNT(*) AS total_users 
FROM public.users;

SELECT 
  COUNT(*) AS total_profiles
FROM public.profiles;

SELECT 
  COUNT(*) AS sync_mismatch
FROM 
  public.users u 
FULL OUTER JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  u.id IS NULL OR p.id IS NULL;

COMMIT; 