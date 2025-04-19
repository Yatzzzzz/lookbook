-- Add policy to allow public access to battle bucket
BEGIN;

-- Ensure battle bucket exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE name = 'battle'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('battle', 'battle', TRUE, 5242880, NULL);
    ELSE 
        UPDATE storage.buckets
        SET public = TRUE
        WHERE name = 'battle';
    END IF;
END
$$;

-- Add policy for public SELECT on battle bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Battle Public Access' 
        AND bucket_id = 'battle'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, operation, definition)
        VALUES (
            'Battle Public Access',
            'battle',
            'SELECT',
            'true'
        );
    END IF;
END
$$;

-- Add policy for authenticated INSERT on battle bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Battle Authenticated Insert' 
        AND bucket_id = 'battle'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, operation, definition)
        VALUES (
            'Battle Authenticated Insert',
            'battle',
            'INSERT',
            'auth.role() = ''authenticated'''
        );
    END IF;
END
$$;

-- Add policy for authenticated UPDATE on battle bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Battle Authenticated Update' 
        AND bucket_id = 'battle'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, operation, definition)
        VALUES (
            'Battle Authenticated Update',
            'battle',
            'UPDATE',
            'auth.role() = ''authenticated'''
        );
    END IF;
END
$$;

-- Add policy for authenticated DELETE on battle bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = 'Battle Authenticated Delete' 
        AND bucket_id = 'battle'
    ) THEN
        INSERT INTO storage.policies (name, bucket_id, operation, definition)
        VALUES (
            'Battle Authenticated Delete',
            'battle',
            'DELETE',
            'auth.role() = ''authenticated'''
        );
    END IF;
END
$$;

COMMIT; 