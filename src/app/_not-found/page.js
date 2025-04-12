export const dynamic = 'force-dynamic';

// Remove generateStaticParams for compatibility

// Basic error page
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Return Home
      </a>
    </div>
  );
} 