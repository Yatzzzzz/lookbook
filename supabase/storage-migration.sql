-- This migration script updates the folder structure for existing files
-- to use username instead of user UUID for organization.

-- First, create a temporary function to help with migration
CREATE OR REPLACE FUNCTION migrate_storage_paths() RETURNS void AS $$
DECLARE
    r RECORD;
    username TEXT;
    new_path TEXT;
    old_path TEXT;
    file_name TEXT;
    current_bucket TEXT;
    user_id TEXT;
BEGIN
    RAISE NOTICE 'Starting storage path migration to username-based structure...';
    
    -- Process each storage object
    FOR r IN 
        SELECT 
            o.id, 
            o.name AS path, 
            o.bucket_id,
            o.owner AS user_id,
            u.username
        FROM 
            storage.objects o
        LEFT JOIN 
            public.users u ON o.owner = u.id
        WHERE 
            -- Only process files that don't already use username folders
            -- and are in any of our buckets (looks, battle, yaynay, opinions)
            (o.bucket_id IN ('looks', 'battle', 'yaynay', 'opinions'))
            AND (
                -- Files directly at root level with user_id-timestamp format
                (o.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+\.[a-zA-Z0-9]+$')
                -- Or files in UUID folders
                OR (o.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/')
                -- Or yaynay bucket files at root with yaynay_ prefix
                OR (o.bucket_id = 'yaynay' AND o.name ~ '^yaynay_')
            )
    LOOP
        -- Skip if no username found
        IF r.username IS NULL THEN
            RAISE NOTICE 'Skipping object % - no username found for user %', r.path, r.user_id;
            CONTINUE;
        END IF;
        
        old_path := r.path;
        current_bucket := r.bucket_id;
        
        -- Extract just the filename part
        IF position('/' in old_path) > 0 THEN
            -- For files in UUID folders
            file_name := substring(old_path from position('/' in old_path) + 1);
            new_path := r.username || '/' || file_name;
        ELSIF old_path ~ '^yaynay_' THEN
            -- For yaynay files with yaynay_ prefix
            file_name := substring(old_path from 8); -- remove 'yaynay_' prefix
            new_path := r.username || '/' || file_name;
        ELSE
            -- For files in UUID-timestamp format at root
            file_name := substring(old_path from position('-' in old_path) + 1);
            new_path := r.username || '/' || file_name;
        END IF;
        
        -- Skip if path is already in the correct format
        IF old_path = new_path THEN
            RAISE NOTICE 'Skipping object % - already using correct format', old_path;
            CONTINUE;
        END IF;
        
        RAISE NOTICE 'Migrating in bucket %: % -> %', current_bucket, old_path, new_path;
        
        -- Update storage.objects record
        UPDATE storage.objects
        SET name = new_path
        WHERE id = r.id;
        
        -- Update references in the looks table if the storage_path column exists
        BEGIN
            -- This may fail silently if the column doesn't exist, that's OK
            UPDATE public.looks
            SET storage_path = new_path
            WHERE storage_path = old_path AND storage_bucket = current_bucket;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update looks table storage_path for %', old_path;
        END;
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