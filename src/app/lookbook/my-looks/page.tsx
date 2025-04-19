'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Import from our centralized client

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface Look {
  look_id: string;
  title: string;
  description: string | null;
  image_url: string;
  audience: string;
  tags: string[] | null;
  created_at: string;
  rating: string;
}

export default function MyLooksPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'friends' | 'private'>('all');

  useEffect(() => {
    async function fetchMyLooks() {
      try {
        setLoading(true);
        
        // In a real app, you'd use the authenticated user's ID
        const userId = 'current_user'; // Replace with actual user authentication
        
        // Query the database for this user's looks
        let query = supabase
          .from('looks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        // Apply audience filter if not "all"
        if (activeFilter !== 'all') {
          query = query.eq('audience', activeFilter);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        setLooks(data || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error fetching looks:', err);
          setError(err.message || 'Failed to load your looks');
        } else {
          console.error('An unexpected error occurred:', err);
          setError('Failed to load your looks due to an unexpected error');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMyLooks();
  }, [activeFilter]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Lookbook</h1>
        <Link 
          href="/look" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Upload New Look
        </Link>
      </div>
      
      {/* Audience Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Looks
          </button>
          
          <button 
            onClick={() => setActiveFilter('public')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeFilter === 'public' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🌎 Public
          </button>
          
          <button 
            onClick={() => setActiveFilter('friends')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeFilter === 'friends' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            👥 Friends Only
          </button>
          
          <button 
            onClick={() => setActiveFilter('private')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeFilter === 'private' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🔒 Private
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-xl">Loading your looks...</p>
        </div>
      ) : looks.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">No looks found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {activeFilter === 'all' 
              ? "You haven't uploaded any looks yet." 
              : `You don't have any ${activeFilter} looks.`}
          </p>
          <Link 
            href="/look" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Your First Look
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {looks.map((look) => (
            <div key={look.look_id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={look.image_url} 
                  alt={look.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  {look.audience === 'public' && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">🌎 Public</span>
                  )}
                  {look.audience === 'friends' && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">👥 Friends</span>
                  )}
                  {look.audience === 'private' && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">🔒 Private</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 truncate">{look.title}</h2>
                {look.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {look.description}
                  </p>
                )}
                
                {look.tags && look.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {look.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(look.created_at).toLocaleDateString()}
                  </span>
                  <Link 
                    href={`/look/${look.look_id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 