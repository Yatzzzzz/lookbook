"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: (url: string, text: string) => string;
}

function ShareLookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lookId = searchParams.get('id');
  
  const [lookUrl, setLookUrl] = useState('');
  const [lookImage, setLookImage] = useState('');
  const [lookTitle, setLookTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      shareUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    },
    {
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      shareUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    },
    {
      name: 'Pinterest',
      icon: 'pinterest',
      color: '#E60023',
      shareUrl: (url, text) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(lookImage)}&description=${encodeURIComponent(text)}`
    },
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      shareUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    },
    {
      name: 'Email',
      icon: 'email',
      color: '#EA4335',
      shareUrl: (url, text) => `mailto:?subject=${encodeURIComponent('Check out this fashion look!')}&body=${encodeURIComponent(text + '\n\n' + url)}`
    }
  ];

  useEffect(() => {
    if (lookId) {
      fetchLookDetails();
    } else {
      setError('Missing look ID. Please select a look to share.');
    }
    
    // Set base URL for the look
    const baseUrl = window.location.origin;
    setLookUrl(`${baseUrl}/look/${lookId}`);
  }, [lookId]);

  const fetchLookDetails = async () => {
    try {
      const response = await fetch(`/api/looks/${lookId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch look details');
      }
      
      const data = await response.json();
      setLookImage(data.image_url);
      setLookTitle(data.description || 'Check out this fashion look!');
      setCustomMessage(`Check out this amazing fashion look: ${data.description}`);
    } catch (err) {
      console.error('Error fetching look details:', err);
      setError('Failed to load look details. Please try again.');
      
      // Set fallback values
      setLookImage('https://placehold.co/400x600/png');
      setLookTitle('Fashion Look');
      setCustomMessage('Check out this amazing fashion look!');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(lookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = lookUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSocialShare = (platform: SocialPlatform) => {
    const shareUrl = platform.shareUrl(lookUrl, customMessage);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lookTitle,
          text: customMessage,
          url: lookUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  // SVG icons for platforms
  const getIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 011-1h3v-4h-3a5 5 0 00-5 5v2.01h-2l-.396 3.98h2.396v8.01z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        );
      case 'pinterest':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 0a12 12 0 00-4.373 23.178c-.017-.391-.003-.889.17-1.329l1.252-5.284s-.311-.621-.311-1.538c0-1.437.834-2.512 1.873-2.512.883 0 1.31.661 1.31 1.453 0 .89-.569 2.212-.86 3.436-.241 1.037.516 1.875 1.543 1.875 1.851 0 3.1-2.38 3.1-5.198 0-2.143-1.448-3.739-4.076-3.739-2.968 0-4.826 2.21-4.826 4.681 0 .853.25 1.454.64 1.916.18.222.206.3.14.546-.45.178-.151.6-.195.772-.65.24-.261.325-.48.236-1.346-.556-1.97-2.036-1.97-3.694 0-2.75 2.32-6.049 6.927-6.049 3.699 0 6.135 2.675 6.135 5.547 0 3.8-2.112 6.644-5.225 6.644-1.045 0-2.026-.566-2.367-1.206 0 0-.564 2.232-.68 2.666-.203.782-.612 1.563-.98 2.175a12.011 12.011 0 003.38.481A12 12 0 0012 0z" />
          </svg>
        );
      case 'whatsapp':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        );
      case 'email':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        );
      default:
        return null;
    }
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
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Share Look</h1>
      
      {error && (
        <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}
      
      {lookImage && (
        <div className="relative aspect-[3/4] w-full mb-6 rounded-lg overflow-hidden">
          <Image
            src={lookImage}
            alt={lookTitle}
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-lg"
          />
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customize Your Message
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Copy Link
          </label>
          <span className={`text-xs font-medium ${copied ? 'text-green-500' : 'text-gray-500'}`}>
            {copied ? 'Copied!' : 'Click to copy'}
          </span>
        </div>
        <div className="flex">
          <input
            type="text"
            value={lookUrl}
            readOnly
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
          >
            Copy
          </button>
        </div>
      </div>
      
      {/* Native Share API Button (Mobile) */}
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          onClick={handleNativeShare}
          className="w-full mb-6 px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
          Share via Device
        </button>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-4">Share on Social Media</h2>
        <div className="grid grid-cols-3 gap-3">
          {socialPlatforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleSocialShare(platform)}
              className="flex flex-col items-center p-3 rounded-md hover:bg-gray-100 transition-colors"
              style={{ color: platform.color }}
            >
              {getIcon(platform.icon)}
              <span className="text-xs mt-2 text-gray-700">{platform.name}</span>
            </button>
          ))}
        </div>
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

export default function ShareLookPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShareLookContent />
    </Suspense>
  );
} 