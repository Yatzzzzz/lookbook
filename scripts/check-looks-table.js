const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found. Make sure .env.local file is properly set up.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLooksTable() {
  try {
    console.log('Checking looks table structure...');
    
    // Attempt to get structure by querying a single record
    const { data: lookData, error: lookError } = await supabase
      .from('looks')
      .select('*')
      .limit(1);
    
    if (lookError) {
      console.error('Error accessing looks table:', lookError.message);
      return;
    }
    
    if (!lookData || lookData.length === 0) {
      console.log('No records found in looks table. Creating test record to check structure...');
      
      // Try to insert a test record to check if columns exist
      const testRecord = {
        user_id: '00000000-0000-0000-0000-000000000000',
        image_url: 'https://example.com/test.jpg',
        description: 'Test description',
        upload_type: 'test',
        feature_in: ['test'],
        audience: 'everyone',
        storage_bucket: 'test',
        storage_path: 'test/path.jpg'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('looks')
        .insert(testRecord)
        .select();
      
      if (insertError) {
        console.error('Error inserting test record:', insertError.message);
        console.log('Checking which columns might be causing the error...');
        
        // Try to get table information using system tables
        const { data: columnsData, error: columnsError } = await supabase
          .rpc('get_table_columns', { table_name: 'looks' });
        
        if (columnsError) {
          console.error('Unable to retrieve column information:', columnsError.message);
        } else if (columnsData) {
          console.log('Available columns in looks table:');
          columnsData.forEach(column => {
            console.log(`- ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})`);
          });
        }
      } else {
        console.log('Successfully inserted test record. Table structure looks good.');
        
        // Clean up test record
        await supabase
          .from('looks')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
        
        console.log('Test record removed.');
      }
    } else {
      console.log('Found existing record in looks table. Columns available:');
      const columns = Object.keys(lookData[0]);
      columns.forEach(column => {
        console.log(`- ${column}: ${typeof lookData[0][column]}`);
      });
      
      // Check for specific required columns
      const requiredColumns = [
        'user_id', 'image_url', 'description', 'upload_type', 
        'feature_in', 'audience', 'storage_bucket', 'storage_path'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\nWARNING: Missing required columns in looks table:');
        missingColumns.forEach(col => console.log(`- ${col}`));
      } else {
        console.log('\nAll required columns are present in the looks table.');
      }
    }
  } catch (err) {
    console.error('Error checking looks table:', err);
  }
}

checkLooksTable(); 