'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TestPagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const links = [
    { label: 'Home', href: '/testpages' },
    { label: 'AI Assistant', href: '/testpages/ai-assistant' },
    { label: 'Lookbook', href: '/testpages/lookbook' },
    { label: 'Rating Showcase', href: '/testpages/rating-showcase' },
    { label: 'Battle', href: '/testpages/battle' },
    { label: 'Upload', href: '/testpages/upload' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-amber-500 text-black p-3 text-center">
        <p className="font-medium">⚠️ Test Feature Area - These pages are experimental and under development</p>
      </div>
      
      <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-4 gap-2 justify-center">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      
      <main className="flex-1 p-4">
        {children}
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-sm">
        <p>These test pages use Radix UI primitives and Tailwind CSS (not shadcn)</p>
        <p className="mt-2">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to main application
          </Link>
        </p>
      </footer>
    </div>
  );
} 