-- SQL Script to update users table and implement display name functionality
-- For Lookbook Fashion Social Network on Supabase

-- PART 1: Update users table structure
-- Adding missing columns needed by the application

DO $$
BEGIN
    -- Check and add avatar_url column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to users table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in users table';
    END IF;

    -- Check and add bio column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to users table';
    ELSE
        RAISE NOTICE 'bio column already exists in users table';
    END IF;

    -- Check and add display_name column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column to users table';
    ELSE
        RAISE NOTICE 'display_name column already exists in users table';
    END IF;

    -- Check and add is_active column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists in users table';
    END IF;

    -- Check and add last_sign_in_at column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'last_sign_in_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_sign_in_at column to users table';
    ELSE
        RAISE NOTICE 'last_sign_in_at column already exists in users table';
    END IF;
END $$;

-- PART 2: Update display names for all users
-- Generates display names based on available user data

UPDATE public.users
SET display_name = COALESCE(
    SPLIT_PART(email, '@', 1),
    username,
    'User_' || id
)
WHERE display_name IS NULL OR display_name = '';

-- PART 3: Create function to ensure display names are always populated
-- This maintains this pattern going forward for any new users

CREATE OR REPLACE FUNCTION public.set_default_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
        NEW.display_name := COALESCE(
            SPLIT_PART(NEW.email, '@', 1),
            NEW.username,
            'User_' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 4: Add the trigger to ensure display names are always set

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'ensure_display_name_trigger'
    ) THEN
        CREATE TRIGGER ensure_display_name_trigger
        BEFORE INSERT OR UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION public.set_default_display_name();
        
        RAISE NOTICE 'Created trigger to ensure display names are always populated';
    ELSE
        RAISE NOTICE 'Trigger already exists for display names';
    END IF;
END $$;

-- PART 5: Add text search capabilities for username and display_name
-- Create trigram extension if it doesn't exist

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for text search on username and display_name for fast user lookups

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

-- PART 6: Create a search function to find users by name

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

-- PART 7: Create or update view for public user profiles

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
    is_active = true OR is_active IS NULL;

-- PART 8: Show summary of users with display names

SELECT 
    COUNT(*) AS total_users,
    COUNT(display_name) AS users_with_display_names,
    COUNT(*) - COUNT(NULLIF(display_name, '')) AS users_needing_display_names
FROM 
    public.users; 