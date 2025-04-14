-- Fix the schema issues with the wardrobe table
DO $$
DECLARE
   name_column_exists BOOLEAN;
   Name_column_exists BOOLEAN;
   description_column_exists BOOLEAN;
BEGIN
    -- Check if the wardrobe table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wardrobe') THEN
        RAISE NOTICE 'Wardrobe table found, checking columns...';
        
        -- Check column existence using case-sensitive checks
        SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'wardrobe' AND column_name = 'name') 
        INTO name_column_exists;
        
        SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'wardrobe' AND column_name = 'Name') 
        INTO Name_column_exists;
        
        SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'wardrobe' AND column_name = 'description') 
        INTO description_column_exists;
        
        -- Handle description column
        IF NOT description_column_exists THEN
            ALTER TABLE wardrobe ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to wardrobe table';
        ELSE
            RAISE NOTICE 'Description column already exists';
        END IF;
        
        -- Handle name column issues (case sensitivity)
        IF Name_column_exists AND NOT name_column_exists THEN
            -- We have 'Name' but not 'name' - add the lowercase version
            ALTER TABLE wardrobe ADD COLUMN name TEXT;
            
            -- Update name column to match 'Name' values
            -- Using double quotes to specify case-sensitive column names
            UPDATE wardrobe SET name = "Name";
            
            RAISE NOTICE 'Added lowercase name column and copied values from uppercase Name column';
            
            -- Make name NOT NULL
            ALTER TABLE wardrobe ALTER COLUMN name SET NOT NULL;
            
        ELSIF NOT name_column_exists AND NOT Name_column_exists THEN
            -- Neither name column exists
            ALTER TABLE wardrobe ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed item';
            RAISE NOTICE 'Added lowercase name column with default value';
        ELSE
            RAISE NOTICE 'Name column already exists with correct case';
        END IF;
        
    ELSE
        -- Create the wardrobe table from scratch with all required columns
        CREATE TABLE wardrobe (
            item_id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            color TEXT,
            brand TEXT,
            style TEXT,
            description TEXT,
            image_path TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created wardrobe table with all required columns';
        
        -- Enable Row Level Security
        ALTER TABLE wardrobe ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own wardrobe items" 
        ON wardrobe FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own wardrobe items" 
        ON wardrobe FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own wardrobe items" 
        ON wardrobe FOR UPDATE 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own wardrobe items" 
        ON wardrobe FOR DELETE 
        USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created row level security policies for wardrobe table';
    END IF;
END $$; 