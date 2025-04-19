-- Update storage_bucket for existing looks to ensure proper categorization
DO $$
BEGIN
    -- First, make sure the storage_bucket column exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'looks' AND column_name = 'storage_bucket'
    ) THEN
        -- Update yaynay looks
        -- These would typically have feature_in containing 'yayornay' or similar indicator
        -- Adjust the WHERE clause based on your actual data structure
        UPDATE looks
        SET storage_bucket = 'yaynay'
        WHERE feature_in @> ARRAY['yayornay']::text[]
        AND (storage_bucket IS NULL OR storage_bucket = '');
        
        RAISE NOTICE 'Updated yaynay looks';
        
        -- Update battle looks
        -- These would typically have feature_in containing 'battle' or similar indicator
        -- Adjust the WHERE clause based on your actual data structure
        UPDATE looks
        SET storage_bucket = 'battle'
        WHERE feature_in @> ARRAY['battle']::text[]
        AND (storage_bucket IS NULL OR storage_bucket = '');
        
        RAISE NOTICE 'Updated battle looks';
        
        -- Update any remaining looks to use 'looks' bucket as default
        UPDATE looks
        SET storage_bucket = 'looks'
        WHERE (storage_bucket IS NULL OR storage_bucket = '');
        
        RAISE NOTICE 'Updated remaining looks to default bucket';
    ELSE
        RAISE EXCEPTION 'storage_bucket column does not exist in looks table. Run add-missing-columns.sql first.';
    END IF;
END $$; 