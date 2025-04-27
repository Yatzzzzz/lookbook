-- SQL Script to update user display names
-- This script safely updates display names in the users table
-- Based on existing RLS policies and table structure

-- Step 1: First, check if the display_name column exists in the users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'display_name'
    ) THEN
        -- Add display_name column if it doesn't exist
        ALTER TABLE public.users ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column to users table';
    ELSE
        RAISE NOTICE 'display_name column already exists in users table';
    END IF;
END $$;

-- Step 2: Update display names for all users that don't have one yet
-- Uses common patterns for display names based on username or email
UPDATE public.users
SET display_name = COALESCE(
    SPLIT_PART(email, '@', 1),
    username,
    'User_' || id
)
WHERE display_name IS NULL OR display_name = '';

-- Step 3: Create function to ensure display names are always populated
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

-- Step 4: Add the trigger to ensure display names are always set
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

-- Step 5: Count how many users got updated with display names
SELECT 
    COUNT(*) AS total_users,
    COUNT(display_name) AS users_with_display_names,
    COUNT(*) - COUNT(display_name) AS users_needing_display_names
FROM 
    public.users; 