'use client';

import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Calendar, Pencil, Trash2, Eye, EyeOff, Share } from 'lucide-react';
import { LogWearModal } from './log-wear-modal';
import { ShareOutfitModal } from './share-outfit-modal';

type OutfitActionsProps = {
  outfitId: string;
  visibility?: string;
  outfitName?: string;
  outfitImage?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean; // For smaller action buttons
};

export function OutfitActions({
  outfitId,
  visibility = 'private',
  outfitName,
  outfitImage,
  onEdit,
  onDelete,
  compact = false
}: OutfitActionsProps) {
  const { updateOutfitVisibility, refreshWardrobeItems } = useWardrobe();
  const [isLogWearOpen, setIsLogWearOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isPublic = visibility === 'public' || visibility === 'community';
  
  const handleToggleVisibility = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const newVisibility = isPublic ? 'private' : 'public';
      await updateOutfitVisibility(outfitId, newVisibility);
    } catch (err: any) {
      console.error('Error toggling visibility:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogWear = () => {
    setIsLogWearOpen(true);
  };
  
  const handleShare = () => {
    setIsShareModalOpen(true);
  };
  
  const handleLogWearSuccess = () => {
    refreshWardrobeItems();
  };
  
  const btnClass = compact 
    ? "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    : "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2";
  
  const iconClass = "h-4 w-4";
  
  return (
    <>
      <div className="flex items-center gap-1">
        <button 
          onClick={handleLogWear}
          className={`${btnClass} text-green-600 hover:text-green-700`} 
          title="Log outfit as worn"
        >
          <Calendar className={iconClass} />
          {!compact && <span>Wore Today</span>}
        </button>
        
        {onEdit && (
          <button 
            onClick={onEdit}
            className={`${btnClass} text-blue-600 hover:text-blue-700`} 
            title="Edit outfit"
          >
            <Pencil className={iconClass} />
            {!compact && <span>Edit</span>}
          </button>
        )}
        
        <button 
          onClick={handleToggleVisibility}
          className={`${btnClass} ${isPublic ? 'text-purple-600 hover:text-purple-700' : 'text-gray-600 hover:text-gray-700'}`} 
          title={isPublic ? "Make private" : "Make public"}
          disabled={isProcessing}
        >
          {isPublic ? <EyeOff className={iconClass} /> : <Eye className={iconClass} />}
          {!compact && <span>{isPublic ? 'Private' : 'Public'}</span>}
        </button>
        
        <button 
          onClick={handleShare}
          className={`${btnClass} text-indigo-600 hover:text-indigo-700`} 
          title="Share outfit"
        >
          <Share className={iconClass} />
          {!compact && <span>Share</span>}
        </button>
        
        {onDelete && (
          <button 
            onClick={onDelete}
            className={`${btnClass} text-red-600 hover:text-red-700`} 
            title="Delete outfit"
          >
            <Trash2 className={iconClass} />
            {!compact && <span>Delete</span>}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <LogWearModal
        isOpen={isLogWearOpen}
        onClose={() => setIsLogWearOpen(false)}
        outfitId={outfitId}
        onSuccess={handleLogWearSuccess}
      />
      
      <ShareOutfitModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        outfitId={outfitId}
        initialVisibility={visibility}
        outfitName={outfitName}
        outfitImage={outfitImage}
      />
    </>
  );
} 