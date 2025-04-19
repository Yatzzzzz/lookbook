-- Fix yaynay bucket permissions by dropping and recreating policies
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
    -- Check if our target policy already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow all operations on yaynay bucket'
    ) INTO policy_exists;
    
    -- If the policy exists, first drop it to avoid error
    IF policy_exists THEN
        RAISE NOTICE 'Policy "Allow all operations on yaynay bucket" already exists, dropping it first';
        DROP POLICY "Allow all operations on yaynay bucket" ON storage.objects;
    END IF;
    
    -- Now drop any other existing policies on yaynay bucket to be safe
    DROP POLICY IF EXISTS "Public can read from yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload to yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own files in yaynay bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own files in yaynay bucket" ON storage.objects;
    
    -- Create a completely open policy for yaynay bucket (no restrictions)
    CREATE POLICY "Allow all operations on yaynay bucket - no restrictions"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'yaynay')
    WITH CHECK (bucket_id = 'yaynay');
    
    RAISE NOTICE 'Created unrestricted policy for yaynay bucket';
    
    -- Check if public access is enabled for bucket
    UPDATE storage.buckets 
    SET public = true 
    WHERE name = 'yaynay';
    
    RAISE NOTICE 'Ensured yaynay bucket is set to public';
END $$; 