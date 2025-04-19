import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function listBuckets() {
  const supabase = createServerActionClient({ cookies });
  return await supabase.storage.listBuckets();
}

export async function listBucketContents(bucketName: string, path?: string) {
  const supabase = createServerActionClient({ cookies });
  return await supabase.storage.from(bucketName).list(path || '');
}

export async function getPublicUrl(bucketName: string, path: string) {
  const supabase = createServerActionClient({ cookies });
  return await supabase.storage.from(bucketName).getPublicUrl(path);
} 