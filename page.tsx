console.log('Executing Supabase query with OR condition:', 'upload_type.eq.battle,feature_in.cs.{battle}');
const { data, error } = await supabase
  .from('looks')
  .select(`
    look_id,
    user_id,
    image_url,
    description,
    upload_type,
    feature_in,
    created_at
  `)
  .or('upload_type.eq.battle,feature_in.cs.{battle}')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Supabase query error details:', error);
  throw new Error('Failed to query battle looks: ' + error.message);
}

// Try a simpler query just to see if we can get ANY looks
console.log('Query successful. Number of items returned:', data?.length || 0);
console.log('Executing a simpler query to see if any looks exist at all...');

// First, get the first row from looks table to check column names
const { data: columnData, error: columnError } = await supabase
  .from('looks')
  .select('*')
  .limit(1);

if (columnError) {
  console.error('Error fetching column structure:', columnError);
} else if (columnData && columnData.length > 0) {
  console.log('Column names in looks table:', Object.keys(columnData[0]));
  // Check if the expected column names exist
  const expectedColumns = ['look_id', 'user_id', 'image_url', 'description', 'upload_type', 'feature_in'];
  const missingColumns = expectedColumns.filter(col => !Object.keys(columnData[0]).includes(col));
  if (missingColumns.length > 0) {
    console.error('Missing expected columns:', missingColumns);
  } else {
    console.log('All expected columns exist');
  }
}

// Now get all looks to check values
const { data: allLooksData, error: allLooksError } = await supabase
  .from('looks')
  .select(`
    look_id,
    user_id,
    image_url,
    description,
    upload_type,
    feature_in,
    created_at
  `)
  .limit(10);

if (allLooksError) {
  console.error('Error fetching all looks:', allLooksError);
} else {
  console.log('Total looks in database:', allLooksData?.length || 0);
  if (allLooksData && allLooksData.length > 0) {
    console.log('Sampling upload_type and feature_in values:');
    allLooksData.forEach(look => {
      console.log(`- ID: ${look.look_id}, upload_type: ${look.upload_type}, feature_in: ${JSON.stringify(look.feature_in)}`);
    });
    
    // Try different ways to find battle looks
    console.log('\nTrying alternative battle look queries:');
    
    // 1. Case-insensitive search for 'battle' in upload_type
    const battleByUploadTypeCaseInsensitive = allLooksData.filter(look => 
      look.upload_type && look.upload_type.toLowerCase() === 'battle'
    );
    console.log(`Found ${battleByUploadTypeCaseInsensitive.length} looks with upload_type.toLowerCase() === 'battle'`);
    
    // 2. Try partial match for 'battle' in upload_type
    const battleByUploadTypePartial = allLooksData.filter(look => 
      look.upload_type && look.upload_type.toLowerCase().includes('battle')
    );
    console.log(`Found ${battleByUploadTypePartial.length} looks with upload_type containing 'battle'`);
    
    // 3. Try different feature_in array checks
    const battleByFeatureInStringify = allLooksData.filter(look => 
      look.feature_in && JSON.stringify(look.feature_in).includes('battle')
    );
    console.log(`Found ${battleByFeatureInStringify.length} looks with feature_in JSON.stringify containing 'battle'`);
    
    // 4. Check if feature_in might be a string instead of array
    const battleByFeatureInString = allLooksData.filter(look => 
      typeof look.feature_in === 'string' && look.feature_in.includes('battle')
    );
    console.log(`Found ${battleByFeatureInString.length} looks with feature_in as string containing 'battle'`);
    
    // 5. Display the data types of upload_type and feature_in
    console.log('Data types of fields:');
    if (allLooksData[0]) {
      console.log(`upload_type: ${typeof allLooksData[0].upload_type}`);
      console.log(`feature_in: ${typeof allLooksData[0].feature_in}, isArray: ${Array.isArray(allLooksData[0].feature_in)}`);
    }
  }
} 