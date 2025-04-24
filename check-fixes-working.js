/**
 * Script to verify that all fixes for the opinions feature are working
 * This script checks:
 * 1. The existence of the opinions table in the database
 * 2. The existence of the opinions storage bucket
 * 3. Proper tagging of opinion looks in the database
 * 4. The presence and correctness of utility functions
 */

// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
// NOTE: This script should be run in the same environment as the Next.js app
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const fs = require('fs');
const path = require('path');

/**
 * Main function to run all checks
 */
async function runChecks() {
  console.log('\n🔍 Starting checks for opinions feature fixes...\n');
  
  try {
    // Check if the opinions table exists
    await checkOpinionsTable();
    
    // Check if the opinions storage bucket exists
    await checkOpinionsBucket();
    
    // Check if opinion looks are properly tagged
    await checkOpinionLooksTags();
    
    // Check if utility functions exist and contain required methods
    await checkUtilityFunctions();
    
    console.log('\n✅ All checks completed!');
  } catch (error) {
    console.error('\n❌ Error running checks:', error.message);
    process.exit(1);
  }
}

/**
 * Check if the opinions table exists and has the required columns
 */
async function checkOpinionsTable() {
  console.log('📋 Checking opinions table...');
  
  try {
    // Check if the table exists in the schema
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'opinions');
    
    if (tablesError) {
      throw new Error(`Error checking for opinions table: ${tablesError.message}`);
    }
    
    if (!tablesData || tablesData.length === 0) {
      console.log('❌ The opinions table does not exist in the database');
      console.log('   Run the SQL in create-opinions-table.sql to create it');
      return false;
    }
    
    console.log('✅ The opinions table exists');
    
    // Check if required columns exist
    const { data: columnsData, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'opinions');
    
    if (columnsError) {
      throw new Error(`Error checking columns: ${columnsError.message}`);
    }
    
    const requiredColumns = ['id', 'look_id', 'user_id', 'opinion', 'created_at', 'updated_at'];
    const missingColumns = [];
    
    for (const col of requiredColumns) {
      if (!columnsData.some(c => c.column_name === col)) {
        missingColumns.push(col);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log(`⚠️ The opinions table is missing columns: ${missingColumns.join(', ')}`);
      console.log('   Consider recreating the table with the complete schema');
      return false;
    }
    
    console.log('✅ The opinions table has all required columns');
    return true;
  } catch (error) {
    console.error('❌ Error checking opinions table:', error.message);
    return false;
  }
}

/**
 * Check if the opinions storage bucket exists
 */
async function checkOpinionsBucket() {
  console.log('📦 Checking opinions storage bucket...');
  
  try {
    // Get list of buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Error listing storage buckets: ${error.message}`);
    }
    
    const opinionsBucket = buckets.find(bucket => bucket.name === 'opinions');
    
    if (!opinionsBucket) {
      console.log('❌ The opinions storage bucket does not exist');
      console.log('   You need to create it in the Supabase dashboard or via code');
      return false;
    }
    
    console.log('✅ The opinions storage bucket exists');
    
    // Check if bucket is public
    if (!opinionsBucket.public) {
      console.log('⚠️ The opinions bucket is not set to public');
      console.log('   This may cause issues with loading images in the gallery');
      return false;
    }
    
    console.log('✅ The opinions bucket has public access enabled');
    return true;
  } catch (error) {
    console.error('❌ Error checking opinions bucket:', error.message);
    return false;
  }
}

/**
 * Check if opinion looks are properly tagged
 */
async function checkOpinionLooksTags() {
  console.log('🏷️ Checking opinion looks tagging...');
  
  try {
    // Get opinion looks
    const { data, error } = await supabase
      .from('looks')
      .select('look_id, storage_bucket, upload_type, feature_in')
      .or('storage_bucket.eq.opinions,upload_type.eq.opinions');
    
    if (error) {
      throw new Error(`Error fetching opinion looks: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No opinion looks found in the database');
      console.log('   You may need to upload some opinion looks first');
      return false;
    }
    
    console.log(`✅ Found ${data.length} opinion looks in the database`);
    
    // Check for inconsistently tagged looks
    const inconsistentLooks = data.filter(look => 
      look.storage_bucket !== 'opinions' || 
      look.upload_type !== 'opinions' || 
      !look.feature_in || 
      !look.feature_in.includes('opinions')
    );
    
    if (inconsistentLooks.length > 0) {
      console.log(`⚠️ Found ${inconsistentLooks.length} opinion looks with inconsistent tagging`);
      console.log('   Consider running the migration script to fix these looks');
      return false;
    }
    
    console.log('✅ All opinion looks are properly tagged');
    return true;
  } catch (error) {
    console.error('❌ Error checking opinion looks:', error.message);
    return false;
  }
}

/**
 * Check if utility functions exist and contain required methods
 */
async function checkUtilityFunctions() {
  console.log('🛠️ Checking utility functions...');
  
  const utilityFilePath = path.join(__dirname, 'src', 'lib', 'fix-opinions-fetch.js');
  
  try {
    // Check if the utility file exists
    if (!fs.existsSync(utilityFilePath)) {
      console.log('❌ Utility file not found at:', utilityFilePath);
      return false;
    }
    
    // Read the utility file
    const fileContent = fs.readFileSync(utilityFilePath, 'utf8');
    
    // Check for required functions
    const requiredFunctions = [
      'fetchOpinionLooks',
      'fetchOpinionsForLook',
      'addOpinionToLook',
      'updateOpinionToLook',
      'deleteOpinionFromLook'
    ];
    
    const missingFunctions = [];
    
    for (const funcName of requiredFunctions) {
      if (!fileContent.includes(`export async function ${funcName}`)) {
        missingFunctions.push(funcName);
      }
    }
    
    if (missingFunctions.length > 0) {
      console.log(`⚠️ The utility file is missing functions: ${missingFunctions.join(', ')}`);
      console.log('   You may need to implement these functions in fix-opinions-fetch.js');
      return false;
    }
    
    console.log('✅ All required utility functions exist');
    return true;
  } catch (error) {
    console.error('❌ Error checking utility functions:', error.message);
    return false;
  }
}

// Run the checks
runChecks(); 