# Opinions Feature Setup Guide

## Overview
The Opinions feature allows users to upload fashion opinion looks and view them in a dedicated gallery. This document explains how to set up the required database table and migrate existing opinions.

## Setup Steps

### Automatic Setup (Not working - See Manual Setup)
~~Run the following command to set up the opinions functionality:~~
```bash
node setup-opinions.js
```
**Note**: The automatic setup is currently not working due to SQL execution limitations. Please follow the manual setup instructions below.

### Manual Setup (Recommended)
Since the automatic setup is encountering issues with SQL execution, follow these steps to manually set up the opinions feature:

1. **Create the opinions table in Supabase**:
   - Login to your Supabase dashboard
   - Navigate to the SQL Editor
   - Create a new query and paste the following SQL:

```sql
-- Create opinions table
CREATE TABLE IF NOT EXISTS public.opinions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  look_id UUID NOT NULL REFERENCES public.looks(look_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opinion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for the opinions table
ALTER TABLE public.opinions ENABLE ROW LEVEL SECURITY;

-- Policy for selecting opinions (anyone can view)
CREATE POLICY "Anyone can view opinions" 
ON public.opinions 
FOR SELECT 
USING (true);

-- Policy for inserting opinions (authenticated users only)
CREATE POLICY "Authenticated users can add opinions" 
ON public.opinions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for updating opinions (own opinions only)
CREATE POLICY "Users can update their own opinions" 
ON public.opinions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting opinions (own opinions only)
CREATE POLICY "Users can delete their own opinions" 
ON public.opinions 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
```

2. **Run the migration script** (after creating the table):
   ```bash
   node migrate-opinions.js
   ```

3. **Check if the fixes are working**:
   ```bash
   node check-fixes-working.js
   ```

## File Structure
The following files are relevant to the opinions feature:

- **Upload Page**: `src/app/look/opinions/page.tsx`
- **Gallery Page**: `src/app/gallery/opinions/page.tsx`
- **Utility Functions**: `src/lib/fix-opinions-fetch.js`
- **Setup Scripts**:
  - `create-opinions-table.sql` - SQL for creating the opinions table
  - `create-opinions-table.js` - Script to execute the SQL (not working)
  - `migrate-opinions.js` - Script to migrate existing opinions
  - `setup-opinions.js` - Main setup script (not working)
  - `check-fixes-working.js` - Script to verify that the fixes are working

## Testing
After setup, you can test the opinions feature:

1. Start the development server: `npm run dev`
2. Upload an opinion look: http://localhost:3000/look/opinions
3. View the gallery page: http://localhost:3000/gallery/opinions

## Troubleshooting

### No opinions showing in gallery
- Check if the opinions table exists in your Supabase database
- Verify that opinions are properly migrated
- Ensure that opinion looks are correctly tagged with `upload_type: 'opinions'`, `storage_bucket: 'opinions'`, and `feature_in: ['opinions']`

### Issues with table creation
If you encounter errors creating the opinions table:
1. Login to your Supabase dashboard
2. Go to the SQL Editor
3. Execute the SQL commands in `create-opinions-table.sql` manually

### Migration errors
If the migration script fails:
1. Ensure the opinions table is created before running the migration
2. Check the Supabase credentials in your `.env.local` file

### Storage issues
If opinion images are not uploading properly:
1. Check if the 'opinions' storage bucket exists in Supabase
2. If not, manually create it in the Supabase dashboard with public read access 