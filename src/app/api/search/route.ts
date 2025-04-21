import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    
    console.log('Search query:', searchQuery);
    
    // Return early if no search query
    if (!searchQuery.trim()) {
      return NextResponse.json({ 
        success: true,
        data: {
          results: [],
          total: 0
        }
      });
    }

    // Initialize result container - now with context awareness
    const results = [];
    
    // 1. Search for users by username
    console.log('Searching for users with query:', searchQuery);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .limit(limit);
      
    console.log('User search results:', users);
    console.log('User search error:', usersError);
    
    // Also search for users by email as a fallback
    console.log('Searching for users by email with query:', searchQuery);
    const { data: usersByEmail, error: usersByEmailError } = await supabase
      .from('users')
      .select('id, username, avatar_url, email')
      .ilike('email', `%${searchQuery}%`)
      .limit(limit);
      
    console.log('User search by email results:', usersByEmail);
    
    if (!usersError && users && users.length > 0) {
      // Add users with context
      users.forEach(user => {
        results.push({
          id: user.id,
          type: 'user',
          primary_text: user.username || 'User',
          image_url: user.avatar_url,
          context: 'User Profile',
          url: `/profile/${user.id}`
        });
      });
    }
    
    // Add users found by email if they're not already included
    if (!usersByEmailError && usersByEmail && usersByEmail.length > 0) {
      usersByEmail.forEach(user => {
        // Only add if not already added by username
        if (!results.some(r => r.type === 'user' && r.id === user.id)) {
          results.push({
            id: user.id,
            type: 'user',
            primary_text: user.username || user.email.split('@')[0] || 'User',
            image_url: user.avatar_url,
            context: 'User Profile',
            url: `/profile/${user.id}`
          });
        }
      });
    }
    
    // 2. Search for looks containing the search term in title, description or tags
    const { data: looks, error: looksError } = await supabase
      .from('looks')
      .select('look_id, user_id, username, image_url, title, description, tags')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(limit);
      
    console.log('Looks search results:', looks?.length || 0, 'items found');
    
    if (!looksError && looks && looks.length > 0) {
      // Add looks with context
      looks.forEach(look => {
        results.push({
          id: look.look_id,
          type: 'look',
          primary_text: look.title || 'Fashion Look',
          secondary_text: look.username ? `by @${look.username}` : '',
          description: look.description || '',
          image_url: look.image_url,
          context: 'Fashion Look',
          url: `/look/${look.look_id}`
        });
      });
    }
    
    // 3. Search looks by tags (for brands, styles, etc.)
    const { data: taggedLooks, error: taggedLooksError } = await supabase
      .from('looks')
      .select('look_id, user_id, username, image_url, title, description, tags')
      .contains('tags', [searchQuery])
      .limit(limit);
      
    console.log('Tagged looks search results:', taggedLooks?.length || 0, 'items found');
    
    if (!taggedLooksError && taggedLooks && taggedLooks.length > 0) {
      // Add looks with tag context
      taggedLooks.forEach(look => {
        // Only add if not already included from title/description search
        if (!results.some(r => r.type === 'look' && r.id === look.look_id)) {
          results.push({
            id: look.look_id,
            type: 'look',
            primary_text: look.title || 'Fashion Look',
            secondary_text: look.username ? `by @${look.username}` : '',
            description: look.description || '',
            image_url: look.image_url,
            context: `Tagged with "${searchQuery}"`,
            url: `/look/${look.look_id}`
          });
        }
      });
    }
    
    // 4. Search for wardrobe items
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from('wardrobe')
      .select('item_id, user_id, image_url, title, description, category, tags')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
      .limit(limit);
      
    console.log('Wardrobe items search results:', wardrobeItems?.length || 0, 'items found');
    
    if (!wardrobeError && wardrobeItems && wardrobeItems.length > 0) {
      // Add wardrobe items with context
      wardrobeItems.forEach(item => {
        results.push({
          id: item.item_id,
          type: 'wardrobe',
          primary_text: item.title || item.category || 'Wardrobe Item',
          secondary_text: item.category || '',
          image_url: item.image_url,
          context: 'Wardrobe Item',
          url: `/wardrobe/${item.item_id}`
        });
      });
    }
    
    // 5. Search for common fashion genres, moods, and styles
    // This creates contextual relevance for fashion terms
    const fashionTerms = [
      'Casual', 'Formal', 'Streetwear', 'Bohemian', 'Classic', 'Vintage', 'Minimalist',
      'Grunge', 'Preppy', 'Sporty', 'Athleisure', 'Artsy', 'Punk', 'Goth', 'Business Casual'
    ];
    
    const matchingTerms = fashionTerms.filter(term => 
      term.toLowerCase().includes(searchQuery.toLowerCase()) || 
      searchQuery.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log('Matching fashion terms:', matchingTerms);
    
    if (matchingTerms.length > 0) {
      matchingTerms.forEach(term => {
        results.push({
          id: `style-${term}`,
          type: 'style',
          primary_text: term,
          context: 'Fashion Style',
          url: `/search?q=${encodeURIComponent(term)}`
        });
      });
    }
    
    // Sort results by relevance (can be improved with scoring)
    // Currently prioritizing exact matches in primary text
    results.sort((a, b) => {
      const aExactMatch = a.primary_text.toLowerCase() === searchQuery.toLowerCase();
      const bExactMatch = b.primary_text.toLowerCase() === searchQuery.toLowerCase();
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      return 0;
    });
    
    console.log('Final search results count:', results.length);
    
    return NextResponse.json({ 
      success: true,
      data: {
        results,
        total: results.length
      }
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'An error occurred during search' }, { status: 500 });
  }
} 