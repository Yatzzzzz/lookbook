// Script to set up the complete opinions functionality
require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up opinions functionality...');

try {
  // Step 1: Create the opinions table
  console.log('\n=== STEP 1: Creating opinions table ===');
  execSync('node create-opinions-table.js', { stdio: 'inherit' });
  
  // Step 2: Migrate existing opinions
  console.log('\n=== STEP 2: Migrating existing opinions ===');
  execSync('node migrate-opinions.js', { stdio: 'inherit' });
  
  // Step 3: Show next steps
  console.log('\n=== SETUP COMPLETE ===');
  console.log('All setup steps have been completed.');
  console.log('You can now:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to the opinions page: http://localhost:3000/gallery/opinions');
  console.log('3. Upload new opinion looks: http://localhost:3000/look/opinions');
  
} catch (error) {
  console.error('Error setting up opinions functionality:');
  console.error(error.message);
  process.exit(1);
} 