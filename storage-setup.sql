-- Note: Some of these operations may need to be done through the Supabase UI
-- or using the admin API, as they involve storage operations rather than
-- pure SQL operations.

-- Create storage bucket for look images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('looks', 'looks', true)
ON CONFLICT (id) DO NOTHING;

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
  auth.uid() = owner
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