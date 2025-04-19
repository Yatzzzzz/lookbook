# Supabase Configuration

This directory contains the necessary SQL scripts for configuring Supabase features.

## Creating the Battle Storage Bucket

If you're encountering issues with battle looks not being uploaded to the "battle" storage bucket, it's likely because the bucket hasn't been created in Supabase.

Follow these steps to create the battle bucket:

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to the Supabase Dashboard
2. Navigate to Storage in the sidebar
3. Click "New Bucket"
4. Name the bucket "battle"
5. Check "Enable Public Bucket" to make it a public bucket
6. Click "Create Bucket"

### Option 2: Using the SQL Script

If you prefer to use SQL, you can execute the `create-battle-bucket.sql` script:

1. Log in to the Supabase Dashboard
2. Navigate to the SQL Editor
3. Open the `create-battle-bucket.sql` file from this directory
4. Execute the script by clicking "Run"

### Setting Up RLS Policies

After creating the bucket, you also need to set up RLS policies:

1. Go to Storage in the Supabase Dashboard
2. Click on "Policies" in the sidebar
3. Make sure the following policies exist for the "battle" bucket:
   - Public read access for all files
   - Insert access for authenticated users
   - Update access for object owners
   - Delete access for object owners

If any of these policies are missing, you can create them manually or run the SQL script mentioned above. 