// Script to check opinions table schema in Supabase
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

async function checkOpinionsSchema() {
  console.log('Checking opinions table schema...');
  
  try {
    // Query to check if the opinions table exists in the database
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'opinions' });
    
    if (tableError) {
      console.error('Error checking if opinions table exists:', tableError);
      
      // Alternative approach: try to query the table directly
      const { data: opinionData, error: queryError } = await supabase
        .from('opinions')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.error('Error querying opinions table:', queryError);
        console.log('The opinions table might not exist or has permission issues.');
        
        // Check if we need to create the table
        console.log('\nSuggested SQL to create opinions table:');
        console.log(`
CREATE TABLE IF NOT EXISTS opinions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  look_id UUID REFERENCES looks(look_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS policies
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opinions"
  ON opinions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own opinions"
  ON opinions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opinions"
  ON opinions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opinions"
  ON opinions FOR DELETE
  USING (auth.uid() = user_id);
        `);
      } else {
        console.log('The opinions table exists but the RPC function failed.');
      }
    } else {
      console.log(`Opinions table exists: ${tableExists}`);
      
      // Check the table schema
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'opinions' });
      
      if (columnsError) {
        console.error('Error getting opinions table columns:', columnsError);
      } else {
        console.log('Opinions table columns:');
        console.table(columns);
        
        // Check if required columns exist
        const requiredColumns = ['id', 'look_id', 'user_id', 'comment', 'tags', 'created_at'];
        const missingColumns = requiredColumns.filter(col => 
          !columns.some(c => c.column_name === col)
        );
        
        if (missingColumns.length > 0) {
          console.log(`Missing required columns: ${missingColumns.join(', ')}`);
          console.log('\nSuggested SQL to add missing columns:');
          
          missingColumns.forEach(col => {
            let dataType = 'TEXT';
            let defaultValue = '';
            
            if (col === 'id') {
              dataType = 'UUID';
              defaultValue = 'DEFAULT uuid_generate_v4() PRIMARY KEY';
            } else if (col === 'look_id') {
              dataType = 'UUID';
              defaultValue = 'REFERENCES looks(look_id) ON DELETE CASCADE';
            } else if (col === 'user_id') {
              dataType = 'UUID';
              defaultValue = 'REFERENCES users(id)';
            } else if (col === 'tags') {
              dataType = 'TEXT[]';
              defaultValue = "DEFAULT '{}'";
            } else if (col === 'created_at') {
              dataType = 'TIMESTAMP WITH TIME ZONE';
              defaultValue = 'DEFAULT NOW()';
            }
            
            console.log(`ALTER TABLE opinions ADD COLUMN ${col} ${dataType} ${defaultValue};`);
          });
        } else {
          console.log('All required columns exist in the opinions table.');
        }
      }
    }
    
    // Check if feature_in is an array column in looks table
    const { data: looksColumns, error: looksColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'looks' });
    
    if (looksColumnsError) {
      console.error('Error getting looks table columns:', looksColumnsError);
    } else {
      const featureInColumn = looksColumns.find(c => c.column_name === 'feature_in');
      if (!featureInColumn) {
        console.log('\nfeature_in column is missing in the looks table.');
        console.log('Suggested SQL to add feature_in column:');
        console.log('ALTER TABLE looks ADD COLUMN feature_in TEXT[] DEFAULT \'{}\';');
      } else {
        console.log(`\nfeature_in column exists with data type: ${featureInColumn.data_type}`);
        if (featureInColumn.data_type !== 'ARRAY') {
          console.log('Warning: feature_in should be an array type.');
          console.log('Suggested SQL to fix feature_in column:');
          console.log('ALTER TABLE looks DROP COLUMN feature_in;');
          console.log('ALTER TABLE looks ADD COLUMN feature_in TEXT[] DEFAULT \'{}\';');
        }
      }
      
      // Check if storage_bucket column exists
      const storageBucketColumn = looksColumns.find(c => c.column_name === 'storage_bucket');
      if (!storageBucketColumn) {
        console.log('\nstorage_bucket column is missing in the looks table.');
        console.log('Suggested SQL to add storage_bucket column:');
        console.log('ALTER TABLE looks ADD COLUMN storage_bucket TEXT;');
      } else {
        console.log(`\nstorage_bucket column exists with data type: ${storageBucketColumn.data_type}`);
      }
      
      // Check if upload_type column exists
      const uploadTypeColumn = looksColumns.find(c => c.column_name === 'upload_type');
      if (!uploadTypeColumn) {
        console.log('\nupload_type column is missing in the looks table.');
        console.log('Suggested SQL to add upload_type column:');
        console.log('ALTER TABLE looks ADD COLUMN upload_type TEXT;');
      } else {
        console.log(`\nupload_type column exists with data type: ${uploadTypeColumn.data_type}`);
      }
    }
  } catch (err) {
    console.error('Error checking opinions schema:', err);
  }
}

checkOpinionsSchema().catch(console.error); 