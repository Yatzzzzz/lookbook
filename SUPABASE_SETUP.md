# Supabase Setup Guide for Lookbook

This guide will help you set up Supabase for the Lookbook fashion social network application.

## 1. Create a Supabase Project

1. Sign up or log in at [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Enter a name for your project (e.g., "lookbook")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create new project"

## 2. Get Your API Keys

1. Once your project is created, go to the project dashboard
2. In the left sidebar, click on "Project Settings" (gear icon)
3. Click on "API" in the submenu
4. You will see:
   - **Project URL**: Copy this value for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys** > **anon public**: Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API Keys** > **service_role**: Copy this for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## 3. Set Up Database Tables

Option 1: Using the SQL Editor in Supabase Dashboard:
1. Go to the "SQL Editor" in your Supabase dashboard
2. Create a new query
3. Copy and paste the content of `supabase-setup.sql` from this project
4. Click "Run" to execute the SQL statements

Option 2: Using the Migration Tool:
1. Install Supabase CLI: `npm install -g supabase`
2. Initialize Supabase in your project: `supabase init`
3. Link to your remote project: `--project-ref <project-ref>`supabase link 
4. Create a migration: `supabase migration new initial_setup`
5. Add the SQL from `supabase-setup.sql` to the migration file
6. Apply migrations: `supabase db push`

## 4. Create Storage Bucket

1. In your Supabase dashboard, go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Name it "looks"
4. Set the privacy to "Public" for this demo app
5. Click "Create bucket"

## 5. Set Up Authentication

1. Go to "Authentication" > "Settings" in the left sidebar
2. Under "Email Auth", ensure it's enabled
3. Disable "Email Confirmations" for development purposes (enable in production)
4. Configure any other auth providers as needed

## 6. Set Up Environment Variables

1. Copy the `.env.local.example` file in your project to `.env.local`
2. Fill in the values with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (only needed for server-side operations)
   ```

## 7. Testing the Connection

1. Start your Next.js development server: `npm run dev`
2. Navigate to `/test-connection` in your browser
3. You should see "Connected to Supabase successfully!" if everything is set up correctly

## Troubleshooting

If you encounter connection issues:

1. **Check Environment Variables**: Ensure your `.env.local` file has the correct values and format
2. **Restart the Dev Server**: Changes to `.env.local` require restarting the Next.js server
3. **Check Network Connectivity**: Ensure your network allows connections to the Supabase domain
4. **Verify Tables Exist**: Make sure the `users` table exists in your Supabase database
5. **Check Browser Console**: Look for specific errors in the browser's developer console

## Next Steps

Once your Supabase connection is working:

1. Try creating a user account using the `/signup` page
2. Upload a fashion look using the `/upload` page 
3. View all looks in the `/gallery` page 