'use client';

import { useState, useEffect } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Copy, Share2, Globe, Users, Lock, Check, Link, Twitter, Facebook, Instagram } from 'lucide-react';

type ShareOutfitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outfitId: string;
  initialVisibility?: string;
  outfitName?: string;
  outfitImage?: string;
};

export function ShareOutfitModal({
  isOpen,
  onClose,
  outfitId,
  initialVisibility = 'private',
  outfitName = 'My Outfit',
  outfitImage = ''
}: ShareOutfitModalProps) {
  const { updateOutfitVisibility, addActivityFeedItem } = useWardrobe();
  
  const [visibility, setVisibility] = useState<string>(initialVisibility);
  const [activeTab, setActiveTab] = useState<string>('visibility');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setVisibility(initialVisibility);
      setError(null);
      setSuccess(null);
      setLinkCopied(false);
    }
  }, [isOpen, initialVisibility]);

  const handleUpdateVisibility = async () => {
    if (visibility === initialVisibility) {
      setActiveTab('share');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      await updateOutfitVisibility(outfitId, visibility);
      
      // Add to activity feed if made public or community
      if (visibility === 'public' || visibility === 'community') {
        try {
          await addActivityFeedItem(
            'share',
            'outfit',
            outfitId,
            true,
            {
              outfit_name: outfitName,
              outfit_image: outfitImage,
              visibility: visibility
            }
          );
        } catch (feedError) {
          console.error('Error adding to activity feed:', feedError);
          // Continue even if activity feed update fails
        }
      }
      
      setSuccess(`Outfit is now ${visibility}`);
      setActiveTab('share');
    } catch (err: any) {
      console.error('Error updating visibility:', err);
      setError(err.message || 'Failed to update visibility');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/outfits/view/${outfitId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setError('Failed to copy link');
      });
  };

  const handleSocialShare = (platform: string) => {
    const shareUrl = `${window.location.origin}/outfits/view/${outfitId}`;
    const text = `Check out my outfit: ${outfitName}`;
    
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL
        setError('Instagram sharing is not supported directly. Please copy the link and share manually.');
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Outfit
          </Dialog.Title>
          
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <Tabs.Trigger
                value="visibility"
                className={`px-4 py-2 border-b-2 text-sm ${
                  activeTab === 'visibility' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Visibility
              </Tabs.Trigger>
              <Tabs.Trigger
                value="share"
                className={`px-4 py-2 border-b-2 text-sm ${
                  activeTab === 'share' 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Share
              </Tabs.Trigger>
            </Tabs.List>
            
            <Tabs.Content value="visibility" className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose who can see this outfit
              </p>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`w-full p-3 rounded-md flex items-center gap-3 border ${
                    visibility === 'private'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    visibility === 'private'
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Private</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Only you can see this outfit</p>
                  </div>
                  {visibility === 'private' && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setVisibility('community')}
                  className={`w-full p-3 rounded-md flex items-center gap-3 border ${
                    visibility === 'community'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    visibility === 'community'
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Community</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">People in the Lookbook community can see this outfit</p>
                  </div>
                  {visibility === 'community' && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`w-full p-3 rounded-md flex items-center gap-3 border ${
                    visibility === 'public'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    visibility === 'public'
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Public</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Anyone on the internet can see this outfit</p>
                  </div>
                  {visibility === 'public' && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </button>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleUpdateVisibility}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </Tabs.Content>
            
            <Tabs.Content value="share" className="space-y-4">
              {(visibility === 'public' || visibility === 'community') ? (
                <>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {`${window.location.origin}/outfits/view/${outfitId}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-2 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium mb-3">Share to social media</h3>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleSocialShare('twitter')}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        aria-label="Share on Twitter"
                      >
                        <Twitter className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocialShare('facebook')}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        aria-label="Share on Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
                        aria-label="Share on Instagram"
                        onClick={() => handleCopyLink()}
                        title="Copy link to share on Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    This outfit is private. Change visibility to share with others.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('visibility')}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change visibility settings
                  </button>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
          
          <Dialog.Close className="absolute top-4 right-4 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 