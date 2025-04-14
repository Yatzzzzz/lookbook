-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe', 'wardrobe', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing policies for the wardrobe bucket to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view wardrobe files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Allow anyone to read files in the wardrobe bucket (since it's public)
CREATE POLICY "Anyone can view wardrobe files"
ON storage.objects FOR SELECT
USING (bucket_id = 'wardrobe');

-- Only allow authenticated users to insert files into their own folder
-- The folders are named after the user's UUID
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (CASE 
    WHEN position('/' IN name) > 0 
    THEN substring(name from 1 for position('/' IN name) - 1)
    ELSE name
  END)
);

-- Only allow users to update their own files
CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (CASE 
    WHEN position('/' IN name) > 0 
    THEN substring(name from 1 for position('/' IN name) - 1)
    ELSE name
  END)
);

-- Only allow users to delete their own files
CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (CASE 
    WHEN position('/' IN name) > 0 
    THEN substring(name from 1 for position('/' IN name) - 1)
    ELSE name
  END)
); 