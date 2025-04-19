# Fixing Supabase Image Loading Issues

If you're encountering errors with images loading from Supabase storage, especially with messages like:

```
Error: Failed to load image: https://wwjuohjstrcyvshfuadr.supabase.co/storage/v1/object/public/battle/user_a41c86ee/1745016812247-main.jpg
```

Follow these steps to resolve the issue:

## 1. Check Supabase Bucket Configuration

First, make sure your "battle" bucket exists and is properly configured:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to Storage in the left sidebar
4. Check if the "battle" bucket exists
5. If it doesn't exist, create it with "Public" access enabled

## 2. Update Bucket Policies

Run the SQL script `update-battle-bucket-policies.sql` in the Supabase SQL Editor to:
- Ensure the battle bucket is marked as public
- Create proper access policies
- Set up CORS configuration

Steps:
1. Go to SQL Editor in Supabase dashboard
2. Open the file `supabase/update-battle-bucket-policies.sql` from this project
3. Run the SQL commands
4. Verify the output shows the bucket is public and CORS is configured

## 3. Check Next.js Image Configuration

If you're using the Next.js Image component, make sure your `next.config.js` file is properly configured:

```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'wwjuohjstrcyvshfuadr.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/**',
    }
  ],
  // Set unoptimized to true to prevent issues with Supabase storage URLs
  unoptimized: true,
  domains: ['wwjuohjstrcyvshfuadr.supabase.co'],
},
```

## 4. Use unoptimized Images for Supabase

In components using Supabase storage images, make sure to:

1. Use the `unoptimized` prop for Next.js Image components
2. Add proper error handling for images
3. Implement fallback UI for failed images

Example:

```tsx
<Image
  src={imageUrl}
  alt="Image description"
  width={400}
  height={300}
  unoptimized={true}
  onError={() => handleImageError(imageKey, imageUrl)}
/>
```

## 5. Run the Diagnostic Script

You can run the diagnostic script to check your Supabase storage configuration:

```bash
node -r dotenv/config src/scripts/check-battle-storage.js
```

This will:
- Check if the battle bucket exists
- List folders and files
- Verify public URLs are accessible
- Report any issues found

## 6. Clear Browser Cache

Sometimes browser caching can cause persistent image loading issues:

1. Open developer tools (F12 or Ctrl+Shift+I)
2. Go to Network tab
3. Check "Disable cache"
4. Hold Shift while clicking the refresh button

## 7. Restart Development Server

After making changes, restart your Next.js development server:

```bash
npm run dev
```

## Still Having Issues?

If you're still experiencing image loading problems:

1. Check browser console for specific error messages
2. Verify the image URLs are correctly formatted
3. Ensure your Supabase credentials are valid
4. Try accessing the image URLs directly in the browser
5. Contact Supabase support if you suspect it's a platform issue 