// Script to check for battle looks in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBattleLooks() {
  try {
    console.log('Checking for battle looks...');
    
    // Query looks with upload_type = battle
    const { data: uploadTypeData, error: uploadTypeError } = await supabase
      .from('looks')
      .select('*')
      .eq('upload_type', 'battle');
      
    if (uploadTypeError) {
      throw uploadTypeError;
    }
    
    console.log(`Found ${uploadTypeData.length} looks with upload_type = 'battle'`);
    
    // Query looks with feature_in containing battle
    const { data: featureInData, error: featureInError } = await supabase
      .from('looks')
      .select('*')
      .contains('feature_in', ['battle']);
      
    if (featureInError) {
      throw featureInError;
    }
    
    console.log(`Found ${featureInData.length} looks with feature_in containing 'battle'`);
    
    // Query looks with both conditions (what gallery/battle page uses)
    const { data: combinedData, error: combinedError } = await supabase
      .from('looks')
      .select('*')
      .or(`upload_type.eq.battle,feature_in.cs.{battle}`);
      
    if (combinedError) {
      throw combinedError;
    }
    
    console.log(`Found ${combinedData.length} looks with either condition (what page uses)`);
    
    if (combinedData.length > 0) {
      console.log('\nHere are the most recent battle looks:');
      combinedData.slice(0, 3).forEach((look, index) => {
        console.log(`Look ${index + 1}:`);
        console.log(`  - ID: ${look.look_id}`);
        console.log(`  - Upload Type: ${look.upload_type}`);
        console.log(`  - Feature In: ${JSON.stringify(look.feature_in)}`);
        console.log(`  - Created At: ${look.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking battle looks:', error.message);
  }
}

// Execute the function
checkBattleLooks(); 