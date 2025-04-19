const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error fetching buckets:', error);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public ? 'yes' : 'no'})`);
    });
    
    // Check if yaynay bucket exists
    const yaynayExists = buckets.some(bucket => bucket.name === 'yaynay');
    
    if (!yaynayExists) {
      console.log('\nWarning: "yaynay" bucket not found! This is required for the Yay or Nay feature.');
    }
  } catch (err) {
    console.error('Error checking buckets:', err);
  }
}

checkBuckets(); 