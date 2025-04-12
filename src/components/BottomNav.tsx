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

  const navItems = [
    { name: 'Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Search', path: '/search', icon: '🔍' },
    { name: 'Look', path: '/look', icon: '📸' },
    { name: 'Trends', path: '/trends', icon: '📈' },
    { name: 'Lookbook', path: '/lookbook', icon: '👤' },
    { name: 'AI', path: '/ai', icon: '🤖' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2 px-4">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center p-2 ${
              activeTab === item.path
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(item.path)}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 