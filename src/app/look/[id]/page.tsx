"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserAvatar } from '@/components/UserAvatar';

interface Look {
  id: string;
  image_url: string;
  description: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  likes: number;
  comments: number;
  is_liked: boolean;
  tags: string[];
  brands: string[];
  style: string;
  occasion: string;
  season: string;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  comment: string;
  created_at: string;
}

export default function LookPage() {
  const params = useParams();
  const router = useRouter();
  const lookId = params.id as string;
  
  const [look, setLook] = useState<Look | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (lookId) {
      fetchLook();
      fetchComments();
    }
  }, [lookId]);

  const fetchLook = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/looks/${lookId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch look');
      }
      
      const data = await response.json();
      setLook(data);
    } catch (err) {
      console.error('Error fetching look:', err);
      setError('Failed to load look. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/looks/${lookId}/comments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      // We don't set the main error state here to still show the look
    }
  };

  const handleLike = async () => {
    if (!look) return;
    
    // Optimistic update
    setLook(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        likes: prev.is_liked ? prev.likes - 1 : prev.likes + 1,
        is_liked: !prev.is_liked
      };
    });
    
    try {
      const response = await fetch(`/api/looks/${lookId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ like: !look.is_liked }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
      
      // Refetch to ensure data consistency
      fetchLook();
    } catch (err) {
      console.error('Error liking look:', err);
      // Revert optimistic update on error
      fetchLook();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    
    try {
      const response = await fetch(`/api/looks/${lookId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      // Clear input and refetch comments
      setNewComment('');
      fetchComments();
      
      // Update comment count on the look
      setLook(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments + 1
        };
      });
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      // If navigator.share is available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: look?.description || 'Check out this fashion look!',
          text: 'Check out this amazing fashion look I found!',
          url: window.location.href,
        });
        return;
      }
      
      // Fallback to clipboard copy for desktop
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !look) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
          {error || 'Look not found.'}
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Look Image */}
        <div className="relative w-full aspect-[4/5] md:aspect-[4/3]">
          <Image
            src={look.image_url}
            alt={look.description}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <UserAvatar
              src={look.user_avatar}
              alt={look.user_name}
              size="md"
            />
            <div>
              <h3 className="font-semibold">{look.user_name}</h3>
              <p className="text-sm text-gray-500">
                {new Date(look.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-gray-800 mb-6">{look.description}</p>
          
          {/* Actions */}
          <div className="flex space-x-4 mb-6">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 ${look.is_liked ? 'text-red-500' : 'text-gray-500'}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill={look.is_liked ? "currentColor" : "none"} 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{look.likes}</span>
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className="flex items-center space-x-1 text-gray-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{look.comments}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-500 ml-auto"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comments ({look.comments})
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Tags */}
              {look.tags?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {look.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Brands */}
              {look.brands?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {look.brands.map((brand, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Style, Occasion, Season */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {look.style && (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">Style</h4>
                    <p className="text-sm">{look.style}</p>
                  </div>
                )}
                
                {look.occasion && (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">Occasion</h4>
                    <p className="text-sm">{look.occasion}</p>
                  </div>
                )}
                
                {look.season && (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-medium text-gray-500">Season</h4>
                    <p className="text-sm">{look.season}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Comments List */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <UserAvatar
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="font-medium text-sm">{comment.user_name}</p>
                          <p className="text-gray-800">{comment.comment}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Comment */}
              <form onSubmit={handleCommentSubmit} className="mt-4 flex items-start space-x-3">
                <UserAvatar
                  src="/placeholder-avatar.jpg" // This should be the current user's avatar
                  alt="You"
                  size="sm"
                />
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 pr-16 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="absolute right-2 bottom-2 p-2 text-blue-500 disabled:text-gray-400"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-5 h-5"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push('/gallery')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to Gallery
        </button>
        
        <button
          onClick={() => router.push(`/look/battle?id=${lookId}`)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Battle This Look
        </button>
      </div>
    </div>
  );
} 