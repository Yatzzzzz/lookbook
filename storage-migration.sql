-- This migration script updates the folder structure for existing files
-- to use username instead of user UUID for organization.

-- First, create a temporary function to help with migration
CREATE OR REPLACE FUNCTION migrate_storage_paths() RETURNS void AS $$
DECLARE
    r RECORD;
    username TEXT;
    new_path TEXT;
    current_bucket TEXT;
    file_name TEXT;
    column_exists BOOLEAN;
BEGIN
    -- Check if storage_path column exists in looks table
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'looks' 
        AND column_name = 'storage_path'
    ) INTO column_exists;
    
    -- Loop through all objects in storage
    FOR r IN 
        SELECT 
            objects.id, 
            objects.name, 
            objects.bucket_id, 
            objects.owner,
            pub_users.username
        FROM 
            storage.objects AS objects
        LEFT JOIN
            auth.users AS auth_users ON objects.owner = auth_users.id
        LEFT JOIN
            public.users AS pub_users ON objects.owner = pub_users.id
    LOOP
        -- Skip if no username is found
        IF r.username IS NULL THEN
            RAISE NOTICE 'Skipping object % - no username found for owner %', r.name, r.owner;
            CONTINUE;
        END IF;
        
        -- Extract just the filename from the path (after the last /)
        file_name := substring(r.name from '([^/]+)$');
        
        -- If no filename found, skip
        IF file_name IS NULL OR file_name = '' THEN
            RAISE NOTICE 'Skipping object % - invalid path format', r.name;
            CONTINUE;
        END IF;
        
        -- Create new path with username instead of UUID
        new_path := r.username || '/' || file_name;
        
        -- Skip if the path is already in the correct format
        IF r.name = new_path THEN
            RAISE NOTICE 'Skipping object % - already using username format', r.name;
            CONTINUE;
        END IF;
        
        -- Log the change
        RAISE NOTICE 'Migrating % to % in bucket %', r.name, new_path, r.bucket_id;
        
        -- Update storage.objects record with new path
        UPDATE storage.objects
        SET name = new_path
        WHERE id = r.id;
        
        -- Also update looks table if storage_path column exists
        IF column_exists THEN
            -- Check if storage_bucket column exists too
            PERFORM 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'looks' 
            AND column_name = 'storage_bucket';
            
            IF FOUND THEN
                -- Both columns exist, update normally
                UPDATE public.looks
                SET storage_path = new_path
                WHERE storage_path = r.name AND storage_bucket = r.bucket_id;
            ELSE
                -- Only storage_path exists
                UPDATE public.looks
                SET storage_path = new_path
                WHERE storage_path = r.name;
            END IF;
        ELSE
            RAISE NOTICE 'Skipping looks table update - storage_path column does not exist';
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_storage_paths();

-- Drop the temporary function
DROP FUNCTION migrate_storage_paths();

-- NOTE: This migration only updates database records
-- It does not physically move files in the storage backend
-- For a complete migration, you would need to also copy the actual files
-- to their new locations using the Supabase JavaScript SDK or REST API 