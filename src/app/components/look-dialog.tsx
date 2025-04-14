'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface Look {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface LookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  look: Look;
}

export function LookDialog({ isOpen, onClose, look }: LookDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-6">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {look.title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <div className="aspect-w-16 aspect-h-9 mb-4">
            <img
              src={look.imageUrl}
              alt={look.title}
              className="object-cover w-full h-full rounded-lg"
            />
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">{look.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Posted by {look.author}</span>
              <span>{new Date(look.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>{look.likes} Likes</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                </svg>
                <span>{look.comments} Comments</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 