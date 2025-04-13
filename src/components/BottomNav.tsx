'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('/gallery');

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  // Navigation items - all pointing to gallery for now
  const navItems = [
    { name: 'Home', path: '/gallery', icon: '🏠' },
    { name: 'Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Upload', path: '/gallery', icon: '📸' },
    { name: 'Profile', path: '/gallery', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-lg border-t border-gray-200 py-3 px-4 z-50">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link
              key={item.path + item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-md ${
                activeTab === item.path && item.name === 'Gallery'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              }`}
              onClick={() => setActiveTab(item.path)}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 