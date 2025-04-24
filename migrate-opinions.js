// Script to migrate opinions from look descriptions to the opinions table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and anon key are required.');
  console.error('Make sure you have a .env.local file with the following variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateOpinions() {
  console.log('Migrating opinions from look descriptions to the opinions table...');
  
  // First, check if the opinions table exists
  try {
    const { data: tableCheck, error: tableError } = await supabase
      .from('opinions')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing opinions table:', tableError);
      console.error('Please run create-opinions-table.js first to create the opinions table.');
      return;
    }
  } catch (err) {
    console.error('Error checking opinions table:', err);
    return;
  }
  
  // Fetch all looks with 'opinions' in their feature_in, upload_type, or storage_bucket
  try {
    const { data: looks, error: looksError } = await supabase
      .from('looks')
      .select('*')
      .or('storage_bucket.eq.opinions,upload_type.eq.opinions');
    
    if (looksError) {
      console.error('Error fetching opinion looks:', looksError);
      return;
    }
    
    console.log(`Found ${looks.length} opinion looks to check for embedded opinions.`);
    
    let totalMigrated = 0;
    let totalLooksWithOpinions = 0;
    
    // Process each look for embedded opinions
    for (const look of looks) {
      const description = look.description || '';
      const matches = description.match(/OPINION: (\{.*?\})/g);
      
      if (matches && matches.length > 0) {
        totalLooksWithOpinions++;
        console.log(`Found ${matches.length} embedded opinions in look ${look.look_id}`);
        
        // Extract and migrate each opinion
        for (const match of matches) {
          try {
            const jsonStr = match.replace('OPINION: ', '');
            const opinion = JSON.parse(jsonStr);
            
            // Get user ID from username if available
            let userId = null;
            if (opinion.username) {
              const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('username', opinion.username)
                .single();
                
              if (userData) {
                userId = userData.id;
              }
            }
            
            // If we couldn't find a user, use the look owner's ID
            if (!userId) {
              userId = look.user_id;
            }
            
            // Insert the opinion into the opinions table
            const { error: insertError } = await supabase
              .from('opinions')
              .insert({
                look_id: look.look_id,
                user_id: userId,
                comment: opinion.comment,
                tags: opinion.tags || [],
                created_at: opinion.created_at || new Date().toISOString()
              });
            
            if (insertError) {
              console.error(`Error inserting opinion for look ${look.look_id}:`, insertError);
            } else {
              totalMigrated++;
            }
          } catch (err) {
            console.error(`Error processing opinion in look ${look.look_id}:`, err);
          }
        }
        
        // Optionally, remove the embedded opinions from the description
        // This is commented out to prevent data loss
        /*
        const newDescription = description.replace(/\n\nOPINION: \{.*?\}/g, '');
        const { error: updateError } = await supabase
          .from('looks')
          .update({ description: newDescription })
          .eq('look_id', look.look_id);
        
        if (updateError) {
          console.error(`Error updating look ${look.look_id} description:`, updateError);
        }
        */
      }
    }
    
    console.log(`Migration complete.`);
    console.log(`Found ${totalLooksWithOpinions} looks with embedded opinions.`);
    console.log(`Successfully migrated ${totalMigrated} opinions to the opinions table.`);
    
  } catch (err) {
    console.error('Error in migration process:', err);
  }
}

migrateOpinions().catch(console.error); 