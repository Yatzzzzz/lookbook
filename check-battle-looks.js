// Script to check for battle looks in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBattleLooks() {
  console.log('Checking for battle looks in the database...');
  
  // Step 1: Check the structure of the looks table
  console.log('\n=== STEP 1: Checking looks table structure ===');
  try {
    const { data: tableInfo, error: tableError } = await supabase
      .from('looks')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('Error fetching table structure:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('Looks table structure:', Object.keys(tableInfo[0]));
    } else {
      console.log('Looks table is empty');
    }
  } catch (err) {
    console.error('Error analyzing table structure:', err);
  }
  
  // Step 2: Check for any battle looks by upload_type
  console.log('\n=== STEP 2: Checking for looks with upload_type = battle ===');
  try {
    const { data: battleLooks, error: lookError } = await supabase
      .from('looks')
      .select('*')
      .eq('upload_type', 'battle');
      
    if (lookError) {
      console.error('Error fetching battle looks by upload_type:', lookError);
    } else {
      console.log(`Found ${battleLooks?.length || 0} looks with upload_type = 'battle'`);
      if (battleLooks && battleLooks.length > 0) {
        console.log('Battle looks found:');
        battleLooks.forEach(look => {
          console.log(`- ID: ${look.look_id}, User: ${look.user_id}, Created: ${look.created_at}`);
        });
      }
    }
  } catch (err) {
    console.error('Error fetching battle looks by upload_type:', err);
  }
  
  // Step 3: Check for any battle looks by feature_in array
  console.log('\n=== STEP 3: Checking for looks with feature_in containing battle ===');
  try {
    const { data: featureLooks, error: featureError } = await supabase
      .from('looks')
      .select('*')
      .contains('feature_in', ['battle']);
      
    if (featureError) {
      console.error('Error fetching battle looks by feature_in:', featureError);
      
      // Try an alternative query if the first one fails
      console.log('Trying alternative query for feature_in...');
      const { data: allLooks, error: allLooksError } = await supabase
        .from('looks')
        .select('*');
        
      if (allLooksError) {
        console.error('Error fetching all looks:', allLooksError);
      } else {
        const filteredLooks = allLooks.filter(look => 
          Array.isArray(look.feature_in) && look.feature_in.includes('battle')
        );
        console.log(`Found ${filteredLooks.length} looks with 'battle' in feature_in array`);
        if (filteredLooks.length > 0) {
          console.log('Battle looks found in feature_in:');
          filteredLooks.forEach(look => {
            console.log(`- ID: ${look.look_id}, User: ${look.user_id}, Feature_in: ${JSON.stringify(look.feature_in)}`);
          });
        }
      }
    } else {
      console.log(`Found ${featureLooks?.length || 0} looks with feature_in containing 'battle'`);
      if (featureLooks && featureLooks.length > 0) {
        console.log('Battle looks found in feature_in:');
        featureLooks.forEach(look => {
          console.log(`- ID: ${look.look_id}, User: ${look.user_id}, Feature_in: ${JSON.stringify(look.feature_in)}`);
        });
      }
    }
  } catch (err) {
    console.error('Error fetching battle looks by feature_in:', err);
  }
  
  // Step 4: Check for column names that might be causing the error
  console.log('\n=== STEP 4: Checking for possible schema issues ===');
  try {
    // Check if look_id exists
    const { data: lookIdCheck, error: lookIdError } = await supabase
      .from('looks')
      .select('look_id')
      .limit(1);
      
    if (lookIdError) {
      console.error('Error checking look_id column:', lookIdError);
      console.log('look_id column may not exist or have a different name');
    } else {
      console.log('look_id column exists');
    }
    
    // Check if user_id exists
    const { data: userIdCheck, error: userIdError } = await supabase
      .from('looks')
      .select('user_id')
      .limit(1);
      
    if (userIdError) {
      console.error('Error checking user_id column:', userIdError);
      console.log('user_id column may not exist or have a different name');
    } else {
      console.log('user_id column exists');
    }
    
    // Check if upload_type exists
    const { data: uploadTypeCheck, error: uploadTypeError } = await supabase
      .from('looks')
      .select('upload_type')
      .limit(1);
      
    if (uploadTypeError) {
      console.error('Error checking upload_type column:', uploadTypeError);
      console.log('upload_type column may not exist or have a different name');
    } else {
      console.log('upload_type column exists');
    }
    
    // Check if feature_in exists
    const { data: featureInCheck, error: featureInError } = await supabase
      .from('looks')
      .select('feature_in')
      .limit(1);
      
    if (featureInError) {
      console.error('Error checking feature_in column:', featureInError);
      console.log('feature_in column may not exist or have a different name');
    } else {
      console.log('feature_in column exists');
    }
  } catch (err) {
    console.error('Error checking schema issues:', err);
  }
  
  console.log('\nDatabase check complete');
}

// Run the check
checkBattleLooks().catch(error => {
  console.error('Script error:', error);
}); 