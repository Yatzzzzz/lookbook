/**
 * Utility functions for fetching and displaying opinions in the gallery
 */
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Fetches opinion looks from the database that have been properly tagged
 * and stored with the correct metadata.
 */
export async function fetchOpinionLooks(page = 1, limit = 10) {
  const supabase = createClientComponentClient();
  
  try {
    // Fetch looks marked specifically as opinions
    // This query uses multiple conditions to ensure we get all possible opinion looks
    const { data, error, count } = await supabase
      .from('looks')
      .select('*, user:users(username)', { count: 'exact' })
      .or('storage_bucket.eq.opinions,upload_type.eq.opinions')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit);
    
    if (error) {
      console.error('Error fetching opinion looks:', error);
      throw error;
    }
    
    // Format the data for the UI
    const formattedLooks = data.map(look => ({
      look_id: look.look_id,
      image_url: look.image_url,
      caption: look.description || "What do you think of this?",
      username: look.user?.username || 'Anonymous',
      avatar_url: look.user?.avatar_url,
      created_at: look.created_at,
      comments: [] // Will be populated separately if needed
    }));
    
    return {
      items: formattedLooks,
      pagination: {
        has_more: count > page * limit,
        total: count,
        page,
        limit
      }
    };
  } catch (err) {
    console.error('Error in fetchOpinionLooks:', err);
    // Return empty data with pagination info on error
    return {
      items: [],
      pagination: {
        has_more: false,
        total: 0,
        page,
        limit
      }
    };
  }
}

/**
 * Adds an opinion comment to a look using the opinions table
 */
export async function addOpinionToLook(lookId, comment, tags = []) {
  if (!lookId || !comment) return false;
  
  const supabase = createClientComponentClient();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User must be logged in to add an opinion');
      return false;
    }
    
    // First try to use the opinions table
    try {
      // Add the opinion to the dedicated opinions table
      const { error } = await supabase.from('opinions').insert({
        look_id: lookId,
        user_id: user.id,
        comment,
        tags,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error adding opinion to database:', error);
        throw error;
      }
      
      return true;
    } catch (tableErr) {
      console.error('Failed to use opinions table, falling back to description field:', tableErr);
      
      // Fallback to the description field method if the opinions table doesn't exist
      // Get the current look
      const { data: lookData, error: lookError } = await supabase
        .from('looks')
        .select('description')
        .eq('look_id', lookId)
        .single();
      
      if (lookError) {
        console.error('Error fetching look:', lookError);
        return false;
      }
      
      // Create a mock opinion object
      const opinion = {
        comment,
        tags,
        username: user.email || 'Anonymous',
        created_at: new Date().toISOString()
      };
      
      // Get user's profile for username
      const { data: profileData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (profileData?.username) {
        opinion.username = profileData.username;
      }
      
      // Append this opinion to the description
      let newDescription = lookData.description || '';
      newDescription += `\n\nOPINION: ${JSON.stringify(opinion)}`;
      
      // Update the look
      const { error: updateError } = await supabase
        .from('looks')
        .update({ description: newDescription })
        .eq('look_id', lookId);
      
      if (updateError) {
        console.error('Error updating look with opinion:', updateError);
        return false;
      }
      
      return true;
    }
  } catch (err) {
    console.error('Error in addOpinionToLook:', err);
    return false;
  }
}

/**
 * Fetches opinions (comments) for a specific look using the opinions table
 * with fallback to description field parsing if needed
 */
export async function fetchOpinionsForLook(lookId) {
  if (!lookId) return [];
  
  const supabase = createClientComponentClient();
  
  try {
    // First try to get comments from the opinions table
    try {
      const { data: opinionsData, error: opinionsError } = await supabase
        .from('opinions')
        .select(`
          id,
          comment,
          tags,
          created_at,
          users:user_id(username, avatar_url)
        `)
        .eq('look_id', lookId)
        .order('created_at', { ascending: false });
      
      if (opinionsError) {
        console.error('Error fetching from opinions table:', opinionsError);
        throw opinionsError;
      }
      
      // Map the data to the expected format
      return opinionsData.map(opinion => ({
        id: opinion.id,
        text: opinion.comment,
        tags: opinion.tags || [],
        username: opinion.users?.username || 'Anonymous',
        avatar_url: opinion.users?.avatar_url,
        created_at: opinion.created_at
      }));
    } catch (tableErr) {
      console.error('Failed to use opinions table, falling back to description field:', tableErr);
      
      // Fallback to parsing the description field
      const { data, error } = await supabase
        .from('looks')
        .select(`
          description,
          user:users(username, avatar_url)
        `)
        .eq('look_id', lookId)
        .single();
      
      if (error) {
        console.error(`Error fetching look ${lookId}:`, error);
        throw error;
      }
      
      // Parse opinions from the description field
      const description = data.description || '';
      const opinions = [];
      
      // Look for opinion JSON objects in the description
      const matches = description.match(/OPINION: (\{.*?\})/g);
      
      if (matches) {
        matches.forEach((match, index) => {
          try {
            const jsonStr = match.replace('OPINION: ', '');
            const opinion = JSON.parse(jsonStr);
            
            opinions.push({
              id: `temp-${lookId}-${index}`,
              text: opinion.comment,
              tags: opinion.tags || [],
              username: opinion.username || 'Anonymous',
              avatar_url: data.user?.avatar_url,
              created_at: opinion.created_at || new Date().toISOString()
            });
          } catch (err) {
            console.error('Error parsing opinion:', err);
          }
        });
      }
      
      return opinions;
    }
  } catch (err) {
    console.error('Error in fetchOpinionsForLook:', err);
    return [];
  }
} 