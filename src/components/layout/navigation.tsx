'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Heart, User } from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = '' }: NavigationProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <header className={`sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Lookbook
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link 
            href="/"
            className={`flex items-center space-x-1 ${isActive('/') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>
          
          <Link 
            href="/search"
            className={`flex items-center space-x-1 ${isActive('/search') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Search size={20} />
            <span>Search</span>
          </Link>
          
          <Link 
            href="/create"
            className={`flex items-center space-x-1 ${isActive('/create') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Plus size={20} />
            <span>Create</span>
          </Link>
          
          <Link 
            href="/saved"
            className={`flex items-center space-x-1 ${isActive('/saved') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Heart size={20} />
            <span>Saved</span>
          </Link>
          
          <Link 
            href="/profile"
            className={`flex items-center space-x-1 ${isActive('/profile') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <User size={20} />
            <span>Profile</span>
          </Link>
        </nav>
        
        <div className="md:hidden">
          {/* Mobile menu button */}
          <button className="text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 