'use client';

import Link from 'next/link';
import { useWardrobe } from '../context/WardrobeContext';

export function WardrobeSummary() {
  const { getCategoryCount } = useWardrobe();

  const categories = [
    { name: 'Tops', key: 'top' },
    { name: 'Bottoms', key: 'bottom' },
    { name: 'Dresses', key: 'dress' },
    { name: 'Shoes', key: 'shoes' },
    { name: 'Accessories', key: 'accessories' },
    { name: 'Outerwear', key: 'outerwear' },
    { name: 'Bags', key: 'bags' },
    { name: 'Other', key: 'other' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          My Wardrobe
        </h2>
        <Link
          href="/wardrobe"
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {categories.map(({ name, key }) => (
          <div
            key={key}
            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {name}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {getCategoryCount(key)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 