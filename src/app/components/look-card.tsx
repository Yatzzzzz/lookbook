'use client';

import { useState } from 'react';
import { LookDialog } from './look-dialog';

interface LookCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export function LookCard({
  id,
  title,
  description,
  imageUrl,
  author,
  likes,
  comments,
  createdAt,
}: LookCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="aspect-w-4 aspect-h-5">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full"
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-lg font-semibold truncate">{title}</h3>
          <p className="text-sm text-gray-200 truncate">{description}</p>
          
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{likes}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
              </svg>
              <span>{comments}</span>
            </span>
          </div>
        </div>
      </div>

      <LookDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        look={{
          id,
          title,
          description,
          imageUrl,
          author,
          likes,
          comments,
          createdAt,
        }}
      />
    </>
  );
} 