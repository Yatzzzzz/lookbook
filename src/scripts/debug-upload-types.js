// Script to check available upload types and test uploading a battle look
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUploadTypes() {
  try {
    console.log('---- Debug Upload Types ----');
    
    // 1. Check if we can connect to the database
    try {
      const { data: testData, error: testError } = await supabase
        .from('looks')
        .select('count');
        
      if (testError) {
        console.error('Database connection test failed:', testError);
        return;
      }
      
      console.log('Database connection successful');
    } catch (err) {
      console.error('Database connection error:', err);
      return;
    }
    
    // 2. Check existing looks in the database
    const { data: looks, error: looksError } = await supabase
      .from('looks')
      .select('look_id, upload_type, feature_in, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (looksError) {
      console.error('Error fetching looks:', looksError);
      return;
    }
    
    console.log(`Found ${looks.length} looks in the database:`);
    looks.forEach((look, i) => {
      console.log(`Look ${i+1}:`);
      console.log(`  - look_id: ${look.look_id}`);
      console.log(`  - upload_type: ${look.upload_type}`);
      console.log(`  - feature_in: ${JSON.stringify(look.feature_in)}`);
      console.log(`  - created_at: ${look.created_at}`);
    });
    
    // 3. Run the exact battle query used in the page
    console.log('\nTesting battle query:');
    const { data: battleLooks, error: battleError } = await supabase
      .from('looks')
      .select('look_id, upload_type, feature_in')
      .or('upload_type.eq.battle,feature_in.cs.{battle}')
      .order('created_at', { ascending: false });
      
    if (battleError) {
      console.error('Error with battle query:', battleError);
      return;
    }
    
    console.log(`Found ${battleLooks.length} battle looks:`);
    battleLooks.forEach((look, i) => {
      console.log(`Battle Look ${i+1}:`);
      console.log(`  - look_id: ${look.look_id}`);
      console.log(`  - upload_type: ${look.upload_type}`);
      console.log(`  - feature_in: ${JSON.stringify(look.feature_in)}`);
    });
    
    // 4. Test array query separately
    console.log('\nTesting array query specifically:');
    const { data: arrayLooks, error: arrayError } = await supabase
      .from('looks')
      .select('look_id, feature_in')
      .contains('feature_in', ['battle']);
      
    if (arrayError) {
      console.error('Error with array query:', arrayError);
    } else {
      console.log(`Found ${arrayLooks.length} looks with 'battle' in feature_in array:`);
      arrayLooks.forEach((look, i) => {
        console.log(`  ${i+1}: ${look.look_id} - ${JSON.stringify(look.feature_in)}`);
      });
    }
    
    // 5. Test string query separately
    console.log('\nTesting string query specifically:');
    const { data: stringLooks, error: stringError } = await supabase
      .from('looks')
      .select('look_id, upload_type')
      .eq('upload_type', 'battle');
      
    if (stringError) {
      console.error('Error with string query:', stringError);
    } else {
      console.log(`Found ${stringLooks.length} looks with upload_type = 'battle':`);
      stringLooks.forEach((look, i) => {
        console.log(`  ${i+1}: ${look.look_id} - ${look.upload_type}`);
      });
    }
    
  } catch (err) {
    console.error('Error debugging upload types:', err);
  }
}

// Execute the function
debugUploadTypes(); 