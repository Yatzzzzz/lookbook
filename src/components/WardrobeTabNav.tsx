'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shirt, ShoppingBag, Bell, User, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe } from '@/app/context/WardrobeContext';

interface WardrobeTabNavProps {
  className?: string;
}

export default function WardrobeTabNav({ className = '' }: WardrobeTabNavProps) {
  const pathname = usePathname();
  const { user } = useAuth() || { user: null };
  const { unreadNotificationsCount = 0 } = useWardrobe() || {};

  // Safer way to render icons
  const renderIcon = (Component: React.ElementType) => {
    return <Component className="h-4 w-4" />;
  };

  // Define all the tabs
  const tabs = [
    { name: 'Wardrobe', path: '/wardrobe', icon: renderIcon(Shirt) },
    { name: 'Marketplace', path: '/wardrobe/marketplace', icon: renderIcon(ShoppingBag) },
    { name: 'Outfits', path: '/wardrobe/outfits', icon: renderIcon(Heart) },
    { name: 'Notifications', path: '/wardrobe/notifications', icon: (
      <div className="relative">
        {renderIcon(Bell)}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white text-[8px] w-3 h-3 flex items-center justify-center">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </div>
    ) },
    { name: 'Profile', path: user ? `/wardrobe/profile/${user.id}` : '/wardrobe/profile', icon: renderIcon(User) },
  ];

  const isActive = (path: string) => {
    if (path === '/wardrobe') {
      return pathname === '/wardrobe';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className={`w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="max-w-screen-lg mx-auto">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.path}
              className={`flex items-center justify-center px-3 py-2 text-sm font-medium whitespace-nowrap ${
                isActive(tab.path)
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span>{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 