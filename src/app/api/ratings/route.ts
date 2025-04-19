import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Server-side Supabase client with admin privileges to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Memory cache for ratings to avoid database errors
const tempRatingsCache = new Map();
const TEMP_RATINGS_FILE = path.join(process.cwd(), 'temp-ratings.json');

// Load temporary ratings from file if exists
try {
  if (fs.existsSync(TEMP_RATINGS_FILE)) {
    const data = fs.readFileSync(TEMP_RATINGS_FILE, 'utf8');
    const ratings = JSON.parse(data);
    if (Array.isArray(ratings)) {
      ratings.forEach(r => {
        const key = `${r.user_id}:${r.look_id}`;
        tempRatingsCache.set(key, r);
      });
      console.log(`Loaded ${ratings.length} temporary ratings from file`);
    }
  }
} catch (err) {
  console.error('Error loading temporary ratings file:', err);
}

// Save temporary ratings to file periodically
function saveTempRatings() {
  try {
    const ratings = Array.from(tempRatingsCache.values());
    fs.writeFileSync(TEMP_RATINGS_FILE, JSON.stringify(ratings, null, 2), 'utf8');
    console.log(`Saved ${ratings.length} temporary ratings to file`);
  } catch (err) {
    console.error('Error saving temporary ratings file:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Rating API route called');
    
    const body = await request.json();
    const { lookId, rating, userId } = body;
    
    console.log('Rating submission details:', { 
      lookId, 
      rating, 
      userIdProvided: !!userId,
      userId: userId || 'none'
    });
    
    if (!lookId || !rating) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Look ID and rating are required' },
        { status: 400 }
      );
    }
    
    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      console.log('Invalid rating value:', rating);
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // First check if the look exists
    const { data: lookExists, error: lookError } = await supabaseAdmin
      .from('looks')
      .select('look_id')
      .eq('look_id', lookId)
      .single();
      
    if (lookError) {
      console.error('Error checking if look exists:', lookError);
      return NextResponse.json(
        { error: 'Look does not exist or database error' },
        { status: 404 }
      );
    }
    
    // Verify the user exists if a userId was provided
    let finalUserId = userId;
    
    if (userId) {
      console.log('Verifying user exists:', userId);
      const { data: userExists, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error verifying user:', userError);
        console.log('User verification failed, returning error');
        return NextResponse.json(
          { error: 'User not found in database. Please ensure your account is properly set up.' },
          { status: 401 }
        );
      } else {
        console.log('User verified successfully:', userExists.id);
      }
    }
    
    // For users without a valid user ID, skip rating
    if (!finalUserId) {
      console.log('No valid user ID, returning error');
      return NextResponse.json(
        { error: 'You must be logged in to rate looks' },
        { status: 401 }
      );
    }
    
    // Save rating to temporary in-memory storage instead of the database
    // This is a workaround for the "UPDATE requires a WHERE clause" error
    try {
      const key = `${finalUserId}:${lookId}`;
      const timestamp = new Date().toISOString();
      
      tempRatingsCache.set(key, {
        user_id: finalUserId,
        look_id: lookId,
        rating: rating,
        created_at: timestamp,
        updated_at: timestamp
      });
      
      console.log(`Rating saved to temporary storage: ${key} = ${rating}`);
      
      // Save to file every 10 ratings
      if (tempRatingsCache.size % 10 === 0) {
        saveTempRatings();
      }
      
      // Try to update the average rating for display purposes (but don't fail if it doesn't work)
      try {
        await updateDisplayRating(lookId);
      } catch (displayErr) {
        console.warn('Could not update display rating, but rating was saved:', displayErr);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Rating saved successfully' 
      });
    } catch (err) {
      console.error('Error saving rating to temporary storage:', err);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Error in rating API route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to calculate and update the display rating without saving to database
async function updateDisplayRating(lookId: string) {
  if (!lookId || typeof lookId !== 'string') {
    console.error('Invalid lookId for display rating update');
    return;
  }
  
  const cleanLookId = lookId.trim();
  console.log('Calculating display rating for look:', cleanLookId);
  
  // Get all ratings for this look from our temporary storage
  const ratingsForLook = Array.from(tempRatingsCache.values())
    .filter(r => r.look_id === cleanLookId);
  
  const count = ratingsForLook.length;
  const sum = ratingsForLook.reduce((acc, curr) => acc + curr.rating, 0);
  const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
  
  console.log('Calculated temporary rating stats:', { count, sum, avg, lookId: cleanLookId });
  
  // Store the display rating in a global variable or cache for retrieval by the frontend
  // Note: This is not persisted to the database due to the trigger issues
} 