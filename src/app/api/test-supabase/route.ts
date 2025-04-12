import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database tables listing
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    // Test looks table specifically
    const { data: looksData, error: looksError } = await supabase
      .from('looks')
      .select('*')
      .limit(1);
    
    // Test storage buckets
    const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
    
    // Test direct access to looks bucket
    const { data: looksFiles, error: looksFilesError } = await supabase.storage
      .from('looks')
      .list();
    
    // Test uploading a tiny file
    const testFile = new Uint8Array([0, 1, 2, 3]); // Tiny 4-byte file
    const testFileName = `test-${Date.now()}.bin`;
    const { error: uploadError } = await supabase.storage
      .from('looks')
      .upload(testFileName, testFile);
      
    // If upload succeeded, delete the test file
    if (!uploadError) {
      await supabase.storage
        .from('looks')
        .remove([testFileName]);
    }
    if (!uploadError) {
      await supabase.storage
        .from('looks')
        .remove([testFileName]);
    }
    
    return NextResponse.json({
      database: {
        tables: {
          success: !tablesError,
          error: tablesError ? tablesError.message : null,
          tables: tablesData ? tablesData.map(t => t.tablename) : []
        },
        looks: {
          success: !looksError,
          error: looksError ? looksError.message : null,
          rowCount: looksData ? looksData.length : 0
        }
      },
      storage: {
        buckets: {
          success: !bucketsError,
          error: bucketsError ? bucketsError.message : null,
          buckets: bucketsData ? bucketsData.map(b => b.name) : []
        },
        looksBucket: {
          success: !looksFilesError,
          error: looksFilesError ? looksFilesError.message : null,
          fileCount: looksFiles ? looksFiles.length : 0,
          files: looksFiles ? looksFiles.map(f => f.name).slice(0, 5) : [] // First 5 files only
        },
        upload: {
          success: !uploadError,
          error: uploadError ? uploadError.message : null
        }
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'An unknown error occurred. Please contact support.', 
        contact: 'support@fashionsocial.net'
      }, { status: 500 });
    }
  }
} 