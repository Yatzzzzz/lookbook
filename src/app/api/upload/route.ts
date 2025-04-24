import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createApiSupabaseClient } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'looks';
    const folder = formData.get('folder') as string || '';
    const filename = formData.get('filename') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Generate a unique filename if not provided
    const uniqueFilename = filename || `${Date.now()}-${uuidv4()}.${file.name.split('.').pop()}`;
    
    // Determine storage path
    const storagePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = await supabase
      .storage
      .from(bucket)
      .getPublicUrl(storagePath);
    
    return NextResponse.json({
      success: true,
      path: storagePath,
      url: urlData?.publicUrl,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
} 