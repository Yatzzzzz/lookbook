# Profiles Data Structure Fix

## Issue Description

The application was experiencing an error when trying to access user profile data:

```
Error: Error fetching people: {}
    at createUnhandledError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/console-error.js:27:71)
    at handleClientError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/use-error-handler.js:45:56)
    at console.error (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/globals/intercept-console-error.js:47:56)
    at AudienceSelector.useEffect.fetchPeople (webpack-internal:///(app-pages-browser)/./src/app/look/components/audience-selector.tsx:47:37)
```

The root cause was that the audience-selector component was attempting to fetch user data from the `users` table including an `avatar_url` column, but this column is actually stored in the `profiles` table.

## Database Schema Issue

The application has a dual structure for user data:

1. `users` table - Core user data like id, username, email
2. `profiles` table - Extended user data including avatar_url, bio

This dual structure was causing confusion in components where the code expected all user data to be in one table. Several components were trying to query `avatar_url` from the `users` table, but this column actually exists in the `profiles` table.

## Implemented Fix

### 1. Updated Audience Selector Component

The AudienceSelector component was modified to query the `profiles` table instead of the `users` table when fetching people data. This ensures it can correctly retrieve the `avatar_url` field.

```typescript
// Before
const { data, error } = await supabase
  .from('users')
  .select('id, username, avatar_url')
  .neq('id', user.id)
  .limit(20);

// After
const { data, error } = await supabase
  .from('profiles')
  .select('id, username, avatar_url')
  .neq('id', user.id)
  .limit(20);
```

### 2. Created Profile Sync System

To ensure that every user has a corresponding profile, we've created:

1. An API endpoint at `/api/init-profiles` that:
   - Checks if the `profiles` table exists and creates it if needed
   - Identifies users without profile entries
   - Creates profile entries for those users

2. A `ProfileSyncTrigger` component that can:
   - Be added to any page for manual syncing
   - Be set to automatically sync profiles when mounted

## How to Use the Fix

### Manual Profile Sync

Add the ProfileSyncTrigger component to an admin or settings page:

```tsx
import { ProfileSyncTrigger } from '@/components/ProfileSyncTrigger';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ProfileSyncTrigger />
    </div>
  );
}
```

### Automatic Profile Sync

Add the ProfileSyncTrigger with autoSync to your layout or main page:

```tsx
import { ProfileSyncTrigger } from '@/components/ProfileSyncTrigger';

export default function Layout({ children }) {
  return (
    <div>
      <ProfileSyncTrigger autoSync>
        {children}
      </ProfileSyncTrigger>
    </div>
  );
}
```

### Directly Access the API

You can also directly call the API endpoint:

```typescript
async function syncProfiles() {
  const response = await fetch('/api/init-profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log(data.message);
}
```

## Future Recommendations

1. **Consistent Schema Access**: Consider creating a helper function or service for fetching user data that combines users and profiles data appropriately.

2. **Schema Validation**: Implement database schema validation on application startup to catch mismatches between code expectations and actual database structure.

3. **Documentation**: Document the dual user/profile structure clearly for other developers to avoid similar issues.

4. **Database Refactoring**: Consider merging the users and profiles tables or creating a clearer separation of concerns if you maintain both. 