-- Create yaynay bucket for yay or nay voting images
INSERT INTO storage.buckets (id, name, public)
VALUES ('yaynay', 'yaynay', true)
ON CONFLICT (id) DO NOTHING;

-- Create opinions bucket for detailed fashion opinions
INSERT INTO storage.buckets (id, name, public)
VALUES ('opinions', 'opinions', true)
ON CONFLICT (id) DO NOTHING;

-- Create profiles bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Remove all existing RLS policies on storage.objects
DROP POLICY IF EXISTS "Public can read from yaynay bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to yaynay bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in yaynay bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in yaynay bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can read from opinions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to opinions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in opinions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in opinions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can read from profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in profiles bucket" ON storage.objects;

-- Create completely open policies for all buckets
CREATE POLICY "Allow all operations on yaynay bucket"
ON storage.objects
USING (bucket_id = 'yaynay')
WITH CHECK (bucket_id = 'yaynay');

CREATE POLICY "Allow all operations on opinions bucket"
ON storage.objects
USING (bucket_id = 'opinions')
WITH CHECK (bucket_id = 'opinions');

CREATE POLICY "Allow all operations on profiles bucket"
ON storage.objects
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- Create a catch-all policy for any other buckets
CREATE POLICY "Allow all operations on all buckets"
ON storage.objects
USING (true)
WITH CHECK (true); 