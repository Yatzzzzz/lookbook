"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { UserAvatar } from '@/components/UserAvatar';

interface Opinion {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  rating: number;
  created_at: string;
}

interface Look {
  id: string;
  image_url: string;
  description: string;
  user_name: string;
  user_avatar: string;
}

function LookOpinionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lookId = searchParams.get('id');
  
  const [look, setLook] = useState<Look | null>(null);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpinion, setNewOpinion] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lookId) {
      fetchLookDetails();
      fetchOpinions();
    } else {
      setError('Missing look ID. Please select a look to view opinions.');
    }
  }, [lookId]);

  const fetchLookDetails = async () => {
    try {
      const response = await fetch(`/api/looks/${lookId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch look details');
      }
      
      const data = await response.json();
      setLook({
        id: data.id,
        image_url: data.image_url,
        description: data.description,
        user_name: data.user_name,
        user_avatar: data.user_avatar
      });
    } catch (err) {
      console.error('Error fetching look details:', err);
      setError('Failed to load look details. Please try again.');
      
      // Set fallback values
      setLook({
        id: lookId || '1',
        image_url: 'https://placehold.co/400x600/png',
        description: 'Fashion Look',
        user_name: 'FashionUser',
        user_avatar: 'https://placehold.co/50/png'
      });
    }
  };

  const fetchOpinions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/looks/${lookId}/opinions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opinions');
      }
      
      const data = await response.json();
      setOpinions(data.opinions);
    } catch (err) {
      console.error('Error fetching opinions:', err);
      setError('Failed to load opinions. Please try again.');
      
      // Set fallback data
      setOpinions([
        {
          id: '1',
          user_id: '101',
          user_name: 'StyleExpert',
          user_avatar: 'https://placehold.co/50/png',
          content: 'Love the color combinations and style choice!',
          rating: 5,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: '102',
          user_name: 'FashionCritic',
          user_avatar: 'https://placehold.co/50/png',
          content: 'Good effort but the accessories could be more coordinated.',
          rating: 3,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOpinion.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/looks/${lookId}/opinions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newOpinion,
          rating 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit opinion');
      }
      
      // Clear input and refetch opinions
      setNewOpinion('');
      setRating(5);
      fetchOpinions();
    } catch (err) {
      console.error('Error submitting opinion:', err);
      setError('Failed to submit your opinion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={i < rating ? 'currentColor' : 'none'}
        stroke="currentColor"
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={i < rating ? 0 : 1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ));
  };

  if (error && !lookId) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
        <button 
          onClick={() => router.push('/gallery')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Look Opinions</h1>
      
      {error && (
        <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Look Summary */}
      {look && (
        <div className="flex items-start space-x-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="relative w-24 h-32 rounded-md overflow-hidden shrink-0">
            <Image
              src={look.image_url}
              alt={look.description}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-md"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <UserAvatar
                src={look.user_avatar}
                alt={look.user_name}
                size="sm"
              />
              <span className="font-medium text-sm">{look.user_name}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">{look.description}</p>
            <button
              onClick={() => router.push(`/look/${look.id}`)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Look
            </button>
          </div>
        </div>
      )}
      
      {/* Opinion Form */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Share Your Opinion</h2>
        <form onSubmit={handleSubmitOpinion}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl focus:outline-none"
                >
                  <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Opinion
            </label>
            <textarea
              value={newOpinion}
              onChange={(e) => setNewOpinion(e.target.value)}
              placeholder="Share your thoughts on this look..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!newOpinion.trim() || isSubmitting}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Opinion'}
          </button>
        </form>
      </div>
      
      {/* Opinions List */}
      <div>
        <h2 className="text-lg font-medium mb-4">All Opinions ({opinions.length})</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : opinions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No opinions yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opinions.map((opinion) => (
              <div key={opinion.id} className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserAvatar
                      src={opinion.user_avatar}
                      alt={opinion.user_name}
                      size="sm"
                    />
                    <span className="font-medium">{opinion.user_name}</span>
                  </div>
                  <div className="flex items-center text-yellow-400">
                    {getRatingStars(opinion.rating)}
                  </div>
                </div>
                <p className="text-gray-800 mb-2">{opinion.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(opinion.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default function LookOpinionsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <LookOpinionsContent />
    </Suspense>
  );
} 