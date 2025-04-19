-- Add necessary fields to the looks table to fix connectivity issues

-- First, check if the column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'audience') THEN
        ALTER TABLE looks ADD COLUMN audience VARCHAR(50) DEFAULT 'everyone';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'upload_type') THEN
        ALTER TABLE looks ADD COLUMN upload_type VARCHAR(50) DEFAULT 'regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'tags') THEN
        ALTER TABLE looks ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'likes') THEN
        ALTER TABLE looks ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'views') THEN
        ALTER TABLE looks ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'category') THEN
        ALTER TABLE looks ADD COLUMN category VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'excluded_users') THEN
        ALTER TABLE looks ADD COLUMN excluded_users UUID[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'looks' AND column_name = 'feature_in') THEN
        ALTER TABLE looks ADD COLUMN feature_in TEXT[] DEFAULT ARRAY['gallery'];
    END IF;
END$$;

-- Create index for audience to make filtering faster
CREATE INDEX IF NOT EXISTS idx_looks_audience ON looks (audience);

-- Create index for upload_type to make filtering faster
CREATE INDEX IF NOT EXISTS idx_looks_upload_type ON looks (upload_type);

-- Create index for category to make filtering faster
CREATE INDEX IF NOT EXISTS idx_looks_category ON looks (category); 