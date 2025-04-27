-- SQL Script to update users table structure
-- This script ensures all required fields exist in the users table

-- Step 1: Add missing columns to users table if they don't exist already
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

-- Step 2: Show updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position; 