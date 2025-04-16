'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function TestPagesHome() {
  const testPages = [
    {
      title: 'AI Assistant',
      description: 'Interactive AI fashion assistant with multiple query types',
      href: '/testpages/ai-assistant',
      priority: 'Highest Priority',
      icon: '🤖',
    },
    {
      title: 'Upload & Camera',
      description: 'Advanced upload page with camera integration and AI analysis',
      href: '/testpages/upload',
      priority: 'High Priority',
      icon: '📸',
    },
    {
      title: 'Lookbook',
      description: 'Enhanced lookbook with tabs and masonry layout',
      href: '/testpages/lookbook',
      priority: 'High Priority',
      icon: '👕',
    },
    {
      title: 'Rating Showcase',
      description: 'Rating-focused social interaction implementation',
      href: '/testpages/rating-showcase',
      priority: 'Medium Priority',
      icon: '⭐',
    },
    {
      title: 'Style Battle',
      description: 'Enhanced battle page with AI suggestions',
      href: '/testpages/battle',
      priority: 'Medium Priority',
      icon: '🏆',
    },
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Test Pages</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        These pages implement features from external projects for evaluation before 
        possible integration into the main application. All pages use Radix UI
        primitives and Tailwind CSS.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testPages.map((page) => (
          <Link 
            href={page.href} 
            key={page.href}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <span className="text-4xl">{page.icon}</span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {page.priority}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-4 mb-2">{page.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{page.description}</p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                View Page <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 