-- Add missing columns to the looks table
DO $$
BEGIN
    -- Check if storage_bucket column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'looks' AND column_name = 'storage_bucket'
    ) THEN
        -- Add storage_bucket column
        ALTER TABLE looks ADD COLUMN storage_bucket TEXT;
        RAISE NOTICE 'Added storage_bucket column to looks table';
    ELSE
        RAISE NOTICE 'storage_bucket column already exists';
    END IF;
    
    -- Check if storage_path column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'looks' AND column_name = 'storage_path'
    ) THEN
        -- Add storage_path column
        ALTER TABLE looks ADD COLUMN storage_path TEXT;
        RAISE NOTICE 'Added storage_path column to looks table';
    ELSE
        RAISE NOTICE 'storage_path column already exists';
    END IF;
END $$; 