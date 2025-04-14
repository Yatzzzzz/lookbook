-- Enable Row Level Security on the wardrobe table
ALTER TABLE wardrobe ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting only the user's own wardrobe items
CREATE POLICY "Users can view their own wardrobe items" 
ON wardrobe FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for inserting new wardrobe items
CREATE POLICY "Users can insert their own wardrobe items" 
ON wardrobe FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for updating only the user's own wardrobe items
CREATE POLICY "Users can update their own wardrobe items" 
ON wardrobe FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for deleting only the user's own wardrobe items
CREATE POLICY "Users can delete their own wardrobe items" 
ON wardrobe FOR DELETE 
USING (auth.uid() = user_id);

-- Storage bucket policy
-- First, make sure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe', 'wardrobe', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read files (since bucket is public)
CREATE POLICY "Anyone can view wardrobe files"
ON storage.objects FOR SELECT
USING (bucket_id = 'wardrobe');

-- Only allow authenticated users to insert their own files
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Only allow users to update their own files
CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Only allow users to delete their own files
CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wardrobe' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
); 