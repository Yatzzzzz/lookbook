'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface LookData {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  rating?: string;
}

export default function LookDetailPage() {
  const params = useParams();
  const fileName = decodeURIComponent(params.name as string);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookData, setLookData] = useState<LookData | null>(null);

  useEffect(() => {
    async function fetchLookDetails() {
      try {
        setLoading(true);
        
        // Get the public URL for the image
        const { data: { publicUrl } } = supabase.storage
          .from('looks')
          .getPublicUrl(fileName);
          
        setImageUrl(publicUrl);
        
        // Try to find metadata in the "looks" table
        const { data: lookMetadata } = await supabase
          .from('looks')
          .select('*')
          .eq('image_url', publicUrl)
          .maybeSingle();
          
        if (lookMetadata) {
          setLookData(lookMetadata);
        }
        
      } catch (err: unknown) {
        console.error('Error fetching look details:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load look details');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    if (fileName) {
      fetchLookDetails();
    }
  }, [fileName]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <p className="text-gray-500 text-xl">Loading look details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error loading look details</p>
          <p>{error}</p>
        </div>
        <Link href="/gallery" className="text-blue-600 hover:underline">
          &larr; Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/gallery" className="text-blue-600 hover:underline mb-6 inline-block">
          &larr; Back to Gallery
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            {imageUrl ? (
              <img 
                src={imageUrl}
                alt={lookData?.name ?? fileName.replace(/\.\w+$/, '').replace(/_/g, ' ')} 
                className="w-full h-auto object-cover"
              />
            ) : null}
          </div>
          <div className="p-6 md:w-1/2">
            <h1 className="text-2xl font-bold mb-4">
              {lookData?.name || fileName.replace(/\.\w+$/, '').replace(/_/g, ' ')}
            </h1>
            
            {lookData?.description && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-600 dark:text-gray-400">{lookData?.description}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Uploaded: {lookData ? new Date(lookData.createdAt).toLocaleString() : 'Unknown date'}
              </p>
              
              {lookData && lookData.rating !== undefined && (
                <p className="text-gray-600 dark:text-gray-400">
                  Rating: {lookData.rating}
                </p>
              )}
            </div>
            
            <div className="mt-6 flex space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Share
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save
              </button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
                Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
