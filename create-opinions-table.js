// Script to create the opinions table in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function createOpinionsTable() {
  console.log('Creating opinions table in Supabase...');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create-opinions-table.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If the RPC doesn't exist, we can't execute SQL directly
        console.error('Error executing SQL statement:', error);
        console.log('\nTo create the opinions table, please execute the following SQL in the Supabase SQL Editor:');
        console.log(sqlScript);
        return;
      }
    }
    
    console.log('Opinions table created successfully!');
    
    // Verify the table was created
    const { data: tableExists, error: tableError } = await supabase
      .from('opinions')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error verifying opinions table:', tableError);
      console.log('The table may not have been created successfully.');
    } else {
      console.log('Verified: Opinions table exists and is accessible.');
    }
  } catch (err) {
    console.error('Error creating opinions table:', err);
    console.log('\nTo create the opinions table, please execute the following SQL in the Supabase SQL Editor:');
    console.log(fs.readFileSync(path.join(__dirname, 'create-opinions-table.sql'), 'utf8'));
  }
}

createOpinionsTable().catch(console.error); 