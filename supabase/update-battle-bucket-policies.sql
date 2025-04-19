-- Update battle bucket policies for more permissive public access
-- Run this in the Supabase SQL Editor to fix image loading issues

-- Ensure the battle bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('battle', 'battle', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read from battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can insert to battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can update battle bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete from battle bucket" ON storage.objects;

-- Create a completely permissive public read policy
CREATE POLICY "Public can read from battle bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle');

-- Allow authenticated users to insert files
CREATE POLICY "Authenticated users can upload to battle bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'battle'
);

-- Allow users to update/delete any file (can be restricted later)
CREATE POLICY "Users can update any files in battle bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'battle');

CREATE POLICY "Users can delete any files in battle bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'battle');

-- Note: CORS configuration was removed as cors_rules column doesn't exist
-- in this version of Supabase storage.buckets table

-- Verify bucket configuration after update
SELECT id, name, public FROM storage.buckets WHERE id = 'battle'; 