// Script to check opinions data in Supabase
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

async function checkOpinions() {
  console.log('Checking opinions data...');
  
  // 1. Check if opinions are being properly stored in the looks table
  console.log('\n--- Looks with opinion type ---');
  const { data: opinionLooks, error: looksError } = await supabase
    .from('looks')
    .select('*')
    .eq('upload_type', 'opinions');
  
  if (looksError) {
    console.error('Error fetching looks:', looksError);
  } else {
    console.log(`Found ${opinionLooks.length} looks with upload_type 'opinions'`);
    console.log(opinionLooks);
  }
  
  // 2. Check if storage_bucket is properly set to 'opinions'
  console.log('\n--- Looks with opinions storage bucket ---');
  const { data: storageLooks, error: storageError } = await supabase
    .from('looks')
    .select('*')
    .eq('storage_bucket', 'opinions');
  
  if (storageError) {
    console.error('Error fetching looks with storage bucket:', storageError);
  } else {
    console.log(`Found ${storageLooks.length} looks with storage_bucket 'opinions'`);
    console.log(storageLooks);
  }
  
  // 3. Check opinions table
  console.log('\n--- Opinions table data ---');
  const { data: opinions, error: opinionsError } = await supabase
    .from('opinions')
    .select('*');
  
  if (opinionsError) {
    console.error('Error fetching opinions:', opinionsError);
  } else {
    console.log(`Found ${opinions.length} records in opinions table`);
    console.log(opinions);
  }
  
  // 4. Check if feature_in array contains 'opinions'
  console.log('\n--- Looks with opinions in feature_in ---');
  const { data: featureLooks, error: featureError } = await supabase
    .from('looks')
    .select('*')
    .contains('feature_in', ['opinions']);
  
  if (featureError) {
    console.error('Error fetching looks with feature_in:', featureError);
  } else {
    console.log(`Found ${featureLooks.length} looks with 'opinions' in feature_in array`);
    console.log(featureLooks);
  }
}

checkOpinions().catch(console.error); 