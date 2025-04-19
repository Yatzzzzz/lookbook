-- Remove RLS policies from yaynay bucket
DO $$
BEGIN
    -- Drop all existing policies on yaynay bucket
    DROP POLICY IF EXISTS "Public can read from yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload to yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own files in yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own files in yaynay bucket" ON storage.objects;
    
    -- Create a completely open policy for yaynay bucket (no restrictions)
    CREATE POLICY "Allow all operations on yaynay bucket"
    ON storage.objects
    USING (bucket_id = 'yaynay')
    WITH CHECK (bucket_id = 'yaynay');
    
    RAISE NOTICE 'Removed all RLS policies from yaynay bucket and created an open policy';
END $$; 