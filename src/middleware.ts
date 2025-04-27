import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Redirect the original routes to the new nested routes in the wardrobe
  if (pathname === '/marketplace') {
    url.pathname = '/wardrobe/marketplace';
    return NextResponse.redirect(url);
  }

  if (pathname === '/notifications') {
    url.pathname = '/wardrobe/notifications';
    return NextResponse.redirect(url);
  }

  if (pathname === '/outfits') {
    url.pathname = '/wardrobe/outfits';
    return NextResponse.redirect(url);
  }

  // Handle profile with userId
  if (pathname.startsWith('/profile/')) {
    const userId = pathname.split('/profile/')[1];
    url.pathname = `/wardrobe/profile/${userId}`;
    return NextResponse.redirect(url);
  }

  // Handle profile index
  if (pathname === '/profile') {
    url.pathname = '/wardrobe/profile';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure the middleware to only run on specified paths
export const config = {
  matcher: [
    '/marketplace',
    '/notifications',
    '/outfits',
    '/profile',
    '/profile/:path*'
  ],
}; 