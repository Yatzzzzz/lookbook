import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Get the pathname from the URL
  const path = req.nextUrl.pathname;
  
  // List of protected routes that require authentication
  const protectedRoutes = ['/upload', '/wardrobe', '/lookbook', '/look'];
  
  // Check if the current path is in our protected routes
  if (protectedRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
    // If not authenticated, redirect to login
    if (!session) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/upload', '/wardrobe', '/wardrobe/:path*', '/lookbook', '/lookbook/:path*', '/look', '/look/:path*']
};
