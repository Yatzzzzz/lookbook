'use client';

import * as Avatar from '@radix-ui/react-avatar';
import { useState } from 'react';

interface UserHeaderProps {
  username: string;
  avatarUrl?: string;
  status?: 'online' | 'offline';
}

export function UserHeader({ username, avatarUrl, status = 'offline' }: UserHeaderProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <Avatar.Root className="relative inline-flex h-12 w-12">
        <Avatar.Image
          className="h-full w-full object-cover rounded-full"
          src={imageError ? undefined : avatarUrl}
          alt={username}
          onError={() => setImageError(true)}
        />
        <Avatar.Fallback
          className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          delayMs={600}
        >
          {username.charAt(0).toUpperCase()}
        </Avatar.Fallback>
        {status === 'online' && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 bg-green-500" />
        )}
      </Avatar.Root>
      
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {username}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {status === 'online' ? 'Online' : 'Offline'}
        </p>
      </div>
      
      <button
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Settings"
      >
        <svg
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
} 