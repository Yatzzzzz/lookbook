'use client';

import { PlusCircle } from 'lucide-react';

interface AddItemButtonProps {
  onClick: () => void;
}

export default function AddItemButton({ onClick }: AddItemButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      aria-label="Add item to wardrobe"
    >
      <PlusCircle size={20} />
      <span>Add Item</span>
    </button>
  );
} 