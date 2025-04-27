-- SQL Script to improve username and display name search capabilities
-- This script adds GIN indexes and search functions for better user discovery

-- Step 1: Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Add GIN indexes for text search on username and display_name
DO $$
BEGIN
    -- Check if username index exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'users_username_trgm_idx'
    ) THEN
        CREATE INDEX users_username_trgm_idx ON public.users USING GIN (username gin_trgm_ops);
        RAISE NOTICE 'Created GIN index on username column';
    ELSE
        RAISE NOTICE 'GIN index on username column already exists';
    END IF;
    
    -- Check if display_name index exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'display_name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'users_display_name_trgm_idx'
    ) THEN
        CREATE INDEX users_display_name_trgm_idx ON public.users USING GIN (display_name gin_trgm_ops);
        RAISE NOTICE 'Created GIN index on display_name column';
    ELSE
        RAISE NOTICE 'Either display_name column does not exist or index already exists';
    END IF;
END $$;

-- Step 3: Create a search function to find users by name
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        GREATEST(
            COALESCE(similarity(u.username, search_term), 0),
            COALESCE(similarity(u.display_name, search_term), 0)
        ) AS similarity
    FROM
        public.users u
    WHERE
        u.username ILIKE '%' || search_term || '%'
        OR u.display_name ILIKE '%' || search_term || '%'
    ORDER BY
        similarity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Example of how to use the search function
-- Comment: This query is for demonstration purposes
/*
SELECT * FROM public.search_users('john');
*/

-- Step 5: Create or update view for public user profiles
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
    id,
    username,
    display_name,
    avatar_url,
    bio,
    created_at,
    last_sign_in_at
FROM
    public.users
WHERE
    is_active = true; 