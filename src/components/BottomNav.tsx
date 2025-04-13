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

  // Navigation items specified from left to right: Gallery, Search, Look, Trends, Lookbook, AI
  const navItems = [
    { name: 'Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Search', path: '/gallery', icon: '🔍' },
    { name: 'Look', path: '/gallery', icon: '📸' },
    { name: 'Trends', path: '/gallery', icon: '📈' },
    { name: 'Lookbook', path: '/gallery', icon: '👤' },
    { name: 'AI', path: '/gallery', icon: '🤖' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-lg border-t border-gray-200 py-2 z-50">
      <div className="max-w-screen-lg mx-auto px-1">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center px-1 ${
                activeTab === item.path && item.name === 'Gallery'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab(item.path)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 