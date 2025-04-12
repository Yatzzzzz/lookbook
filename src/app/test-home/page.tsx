import Link from 'next/link';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function TestHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-white dark:bg-gray-900">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl font-bold mt-10 text-gray-900 dark:text-white">
          Lookbook Test Page
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          Testing Supabase Connection
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
          <Link 
            href="/instruments" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
          >
            View Instruments Data
          </Link>
        </div>
      </main>
    </div>
  );
} 