'use client';

import * as Avatar from '@radix-ui/react-avatar';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ src, name = 'User', size = 'md', className = '' }: UserAvatarProps) {
  // Get first letter of name for fallback
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';
  
  // Determine size class
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-xl'
  };
  
  const sizeClass = sizeClasses[size];
  
  return (
    <Avatar.Root 
      className={`relative inline-flex rounded-full ${sizeClass} ${className}`}
    >
      <Avatar.Image
        className="h-full w-full rounded-full object-cover"
        src={src || undefined}
        alt={`${name}'s avatar`}
      />
      <Avatar.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
      >
        {firstLetter}
      </Avatar.Fallback>
    </Avatar.Root>
  );
} 