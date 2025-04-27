import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

// Rate limiting configuration
const RATE_LIMIT = {
  // Maximum number of requests in a time window
  maxRequests: 10,
  // Time window in milliseconds (10 minutes)
  timeWindow: 10 * 60 * 1000,
  // Store for keeping track of requests by user ID
  requestCounts: new Map<string, { count: number; timestamp: number }>()
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = getSupabaseClient(cookieStore);
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Apply rate limiting
    const now = Date.now();
    const userRequests = RATE_LIMIT.requestCounts.get(userId);
    
    if (userRequests) {
      // Check if the time window has passed
      if (now - userRequests.timestamp > RATE_LIMIT.timeWindow) {
        // Reset counter if time window has passed
        RATE_LIMIT.requestCounts.set(userId, { count: 1, timestamp: now });
      } else if (userRequests.count >= RATE_LIMIT.maxRequests) {
        // Too many requests
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((userRequests.timestamp + RATE_LIMIT.timeWindow - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((userRequests.timestamp + RATE_LIMIT.timeWindow - now) / 1000).toString()
            }
          }
        );
      } else {
        // Increment request count
        RATE_LIMIT.requestCounts.set(userId, { 
          count: userRequests.count + 1, 
          timestamp: userRequests.timestamp 
        });
      }
    } else {
      // First request from this user
      RATE_LIMIT.requestCounts.set(userId, { count: 1, timestamp: now });
    }
    
    // Parse request body as FormData (for handling file uploads)
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Maximum number of files that can be processed at once
    const MAX_FILES = 20;
    
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files can be uploaded at once` },
        { status: 400 }
      );
    }
    
    // Get metadata for each file
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    
    // Process each file
    const results = await Promise.all(
      files.map(async (file, index) => {
        try {
          const fileId = metadata[index]?.id || `file-${index}`;
          const itemMetadata = metadata[index] || {};
          
          // Upload the file to storage
          const { data: storageData, error: storageError } = await supabase.storage
            .from('wardrobe')
            .upload(`${userId}/${file.name}`, file, {
              upsert: true,
              contentType: file.type
            });
          
          if (storageError) {
            throw new Error(`Storage error: ${storageError.message}`);
          }
          
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('wardrobe')
            .getPublicUrl(storageData.path);
          
          // Insert into wardrobe_items table
          const { data: itemData, error: itemError } = await supabase
            .from('wardrobe_items')
            .insert({
              user_id: userId,
              name: itemMetadata.name || file.name.split('.')[0].replace(/[_-]/g, ' '),
              category: itemMetadata.category || 'other',
              color: itemMetadata.color || null,
              brand: itemMetadata.brand || null,
              description: itemMetadata.description || null,
              image_path: publicUrl,
              visibility: 'private'
            })
            .select()
            .single();
          
          if (itemError) {
            throw new Error(`Database error: ${itemError.message}`);
          }
          
          return {
            id: fileId,
            success: true,
            item_id: itemData.item_id,
            name: itemData.name
          };
        } catch (error: any) {
          console.error(`Error processing file ${index}:`, error);
          
          return {
            id: metadata[index]?.id || `file-${index}`,
            success: false,
            error: error.message || 'Failed to process file'
          };
        }
      })
    );
    
    // Count successes and failures
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;
    
    return NextResponse.json({
      success: successCount > 0,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failureCount
      }
    });
  } catch (error: any) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process batch upload' },
      { status: 500 }
    );
  }
} 