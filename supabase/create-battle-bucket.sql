-- Create storage bucket for battle looks if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('battle', 'battle', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage buckets
-- Allow anyone to read from the battle bucket
CREATE POLICY "Public can read from battle bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle');

-- Allow authenticated users to insert their own files
CREATE POLICY "Authenticated users can upload to battle bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'battle' AND
  auth.uid() IS NOT NULL
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files in battle bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'battle' AND
  auth.uid() = owner
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files in battle bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'battle' AND
  auth.uid() = owner
); 