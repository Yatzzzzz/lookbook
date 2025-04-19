'use client';

import { UserAvatar } from './UserAvatar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface UserCardProps {
  username: string;
  avatar?: string | null;
  displayName?: string;
  bio?: string;
  stats?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
  isLink?: boolean;
  href?: string;
  className?: string;
}

export function UserCard({
  username,
  avatar,
  displayName,
  bio,
  stats,
  isLink = false,
  href = '',
  className = ''
}: UserCardProps) {
  const content = (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <UserAvatar src={avatar} name={username} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {displayName || username}
          </p>
          {displayName && (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              @{username}
            </span>
          )}
        </div>
        
        {bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {bio}
          </p>
        )}
        
        {stats && (
          <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {stats.posts !== undefined && (
              <span>{stats.posts} posts</span>
            )}
            {stats.followers !== undefined && (
              <span>{stats.followers} followers</span>
            )}
            {stats.following !== undefined && (
              <span>Following {stats.following}</span>
            )}
          </div>
        )}
      </div>
      
      {isLink && <ChevronRight className="h-4 w-4 text-gray-400" />}
    </div>
  );

  if (isLink && href) {
    return (
      <Link href={href} className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
} 