import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This endpoint is used to run the battle bucket policy setup SQL

export const dynamic = 'force-dynamic';

// Define the SQL to be executed - using the battle-policy.sql content
const policySQL = `
-- Add policy to allow public access to battle bucket
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

-- Set unrestricted access policy for the battle bucket
DROP POLICY IF EXISTS "Allow all operations on battle bucket" ON storage.objects;
CREATE POLICY "Allow all operations on battle bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'battle')
WITH CHECK (bucket_id = 'battle');
`;

export async function POST() {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Execute the SQL
    const { error } = await supabase.rpc('query', { query: policySQL });
    
    if (error) {
      console.error('Error applying storage policy:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // Verify policy was correctly applied
    const { data: policies, error: policyError } = await supabase
      .from('storage.policies')
      .select('name, definition')
      .eq('bucket_id', 'battle');
      
    if (policyError) {
      console.error('Error verifying policies:', policyError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Battle bucket policy applied successfully',
      policies: policies || []
    });
  } catch (error: any) {
    console.error('Error in run-policy-sql route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 