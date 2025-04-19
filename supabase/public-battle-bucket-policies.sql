-- Make sure the bucket is set to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'battle';

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read from battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can insert to battle bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can update battle bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete from battle bucket" ON storage.objects;

-- Create completely open policies for all operations
-- Allow anyone to read files
CREATE POLICY "Public can read from battle bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle');

-- Allow anyone to upload files
CREATE POLICY "Public can insert to battle bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'battle');

-- Allow anyone to update files
CREATE POLICY "Public can update battle bucket objects"
ON storage.objects FOR UPDATE
USING (bucket_id = 'battle');

-- Allow anyone to delete files
CREATE POLICY "Public can delete from battle bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'battle'); 