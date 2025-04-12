// This file contains configuration for pages to exclude from static generation

// List of page paths that should be dynamically rendered and excluded from static generation
export const DYNAMIC_PAGES = [
  '/_not-found',
  '/test-signup-api',
  '/test-connection',
  '/upload-test',
  '/api/test-supabase',
  '/api/test-user'
];

// Helper function to check if a page should be dynamic
export function shouldSkipStaticGeneration(pagePath: string): boolean {
  return DYNAMIC_PAGES.some(path => pagePath.startsWith(path));
} 