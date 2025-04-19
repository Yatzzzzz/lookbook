# Storage Migration to Username-Based Paths

This document explains how to migrate existing storage files from UUID-based paths to username-based paths.

## Background

Originally, some storage buckets like 'yaynay' were storing files using user UUIDs for folder names or prefixes, while others like 'battle' were using usernames. This inconsistency made file organization difficult.

All upload code has now been updated to consistently use username-based paths across all buckets in the format `username/timestamp.extension`.

## Database Requirements

The migration script requires that you have a `public.users` table with the following structure:
- `id`: UUID (matching the auth.users id)
- `username`: TEXT (the username to use in paths)

If your usernames are stored in a different table, you'll need to modify the migration script to join with that table instead.

## Running the Migration

To migrate existing files to the new username-based path structure:

1. Navigate to Supabase Dashboard > SQL Editor
2. Open the `storage-migration.sql` file from this directory
3. Run the script by clicking "Run"

The script will:
1. Find all files in buckets (looks, battle, yaynay, opinions) that use UUID-based paths
2. Lookup the username for each file owner from the `users` table
3. Update the database path references to use username instead of UUID
4. Update any references in the 'looks' table if it has the relevant columns

## Important Notes

- The migration script only updates database path references, not the actual file storage.
- Supabase Storage API will handle the path redirects automatically, so existing frontend code referencing old URLs will still work.
- New uploads will use the username-based path structure, so over time all files will transition to the new format.
- If you encounter any issues with file access after migration, check the storage browser in Supabase dashboard to ensure paths were updated correctly.

## Verifying the Migration

After running the migration, you can verify it by:

1. Going to Storage in the Supabase Dashboard
2. Opening each bucket and confirming that files are organized in username folders
3. Ensuring that your application can still access all files, including previously uploaded ones 