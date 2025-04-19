'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

const uploadTypes = [
  { id: 'regular', name: 'Regular Look' },
  { id: 'battle', name: 'Battle' },
  { id: 'opinion', name: 'Opinion' },
  { id: 'yayornay', name: 'Yay or Nay' }
];

const audienceOptions = [
  { id: 'everyone', name: 'Everyone' },
  { id: 'followers', name: 'Followers' },
  { id: 'friends', name: 'Friends' }
];

const categories = [
  { id: 'casual', name: 'Casual' },
  { id: 'formal', name: 'Formal' },
  { id: 'sport', name: 'Sport' },
  { id: 'party', name: 'Party' },
  { id: 'business', name: 'Business' },
  { id: 'other', name: 'Other' }
];

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadType, setUploadType] = useState('regular');
  const [audience, setAudience] = useState('everyone');
  const [category, setCategory] = useState('casual');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState<string[]>(['gallery']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleFeatureChange = (feature: string) => {
    const updatedFeatures = features.includes(feature)
      ? features.filter(f => f !== feature)
      : [...features, feature];
    
    setFeatures(updatedFeatures);
  };

  // Update features when upload type changes
  useEffect(() => {
    const specialFeatures = ['battle', 'opinion', 'yayornay'];
    
    // Start with all current features except special ones
    const updatedFeatures = features.filter(f => !specialFeatures.includes(f));
    
    // Ensure gallery is always included
    if (!updatedFeatures.includes('gallery')) {
      updatedFeatures.push('gallery');
    }
    
    // Add the feature corresponding to the selected upload type if not regular
    if (uploadType !== 'regular' && !updatedFeatures.includes(uploadType)) {
      updatedFeatures.push(uploadType);
    }
    
    // Only update state if the features array has actually changed
    if (JSON.stringify(features.sort()) !== JSON.stringify(updatedFeatures.sort())) {
      setFeatures(updatedFeatures);
    }

    // Auto-add the upload type to tags for special types
    if (uploadType !== 'regular' && !tags.includes(uploadType)) {
      setTags(prevTags => [...prevTags, uploadType]);
    }
  }, [uploadType, features, tags]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Exit early if no image was selected
    if (!file) {
      toast.error('Please select an image to upload');
      return;
    }
    
    setUploading(true);
    
    try {
      console.log('Starting upload process...');
      console.log('Current state before upload:', { 
        uploadType, 
        features,
        description: description.trim() || null,
        audience,
        category,
        tags: tags.length > 0 ? tags : null
      });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to upload');
        return;
      }
      
      // Get username for path for all upload types
      const { data: profiles } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
          
      const username = profiles?.username || user.id;
      
      // Generate a unique filename with username directory for all upload types
      const fileExt = file.name.split('.').pop();
      const fileName = `${username}/${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload the file to Supabase Storage
      console.log(`Uploading file to Supabase Storage${uploadType === 'battle' ? ' (battle bucket)' : ''}...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(uploadType === 'battle' ? 'battle' : 'looks')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      console.log('File upload successful:', uploadData);
      
      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from(uploadType === 'battle' ? 'battle' : 'looks')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log('Public URL:', publicUrl);
      
      // Properly format the feature_in array for database
      const featureInArray = Array.isArray(features) ? features : 
        features?.split(',').map(f => f.trim()).filter(Boolean) || [];
        
      // For battle type, ensure 'battle' is in the feature_in array
      if (uploadType === 'battle' && !featureInArray.includes('battle')) {
        featureInArray.push('battle');
      }
      
      console.log('Final feature_in array:', featureInArray);
      
      // Ensure tags array includes the upload type for special types
      let finalTags = [...tags];
      if (uploadType !== 'regular' && !finalTags.includes(uploadType)) {
        finalTags.push(uploadType);
      }
      
      console.log('Final tags array:', finalTags);
      
      // Prepare data to insert into the database
      const lookData = {
        user_id: user.id,
        image_url: publicUrl,
        description: description.trim() || null,
        upload_type: uploadType,
        feature_in: featureInArray,
        audience: audience || null,
        category: category || null,
        tags: finalTags.length > 0 ? finalTags : null,
        storage_bucket: uploadType === 'battle' ? 'battle' : 'looks',
        storage_path: fileName
      };
      
      console.log('Final look data to insert:', JSON.stringify(lookData, null, 2));
      
      // Insert the look into the database
      const { data: lookInsertData, error: insertError } = await supabase
        .from('looks')
        .insert(lookData)
        .select();
        
      if (insertError) {
        console.error('Error inserting look:', insertError);
        throw insertError;
      }
      
      console.log('Look inserted successfully. Response data:', lookInsertData);
      
      toast.success('Look uploaded successfully!');
      
      // Redirect to the gallery page
      setTimeout(() => {
        if (uploadType === 'battle') {
          router.push('/gallery/battle');
        } else if (uploadType === 'yayornay') {
          router.push('/gallery/yay-or-nay');
        } else if (uploadType === 'opinion') {
          router.push('/gallery/opinions');
        } else {
          router.push('/gallery');
        }
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload look');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>You must be logged in to upload a look. Please <a href="/login" className="underline">login</a> first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-16">
      <h1 className="text-2xl font-bold mb-4">Upload Your Look</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        {/* Image Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Image</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-center">
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-h-64 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <Upload className="mr-2" size={20} />
                    Select Image
                  </button>
                  <p className="text-sm text-gray-500 mt-2">JPEG, PNG or GIF</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Details</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="Describe your look..."
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md"
                placeholder="Add tags (e.g., summer, casual)"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                <Tag size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500 italic">No tags added yet</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Audience & Categories Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Sharing Options</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Upload Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {uploadTypes.map((type) => (
                <div key={type.id} className={`flex items-center p-2 rounded ${type.id === 'battle' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}`}>
                  <input
                    type="radio"
                    id={`type-${type.id}`}
                    name="uploadType"
                    value={type.id}
                    checked={uploadType === type.id}
                    onChange={() => setUploadType(type.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`type-${type.id}`} className={type.id === 'battle' ? 'font-medium' : ''}>{type.name}</label>
                </div>
              ))}
            </div>
            {uploadType === 'battle' && (
              <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                <p>Battle looks are featured in the Battle Gallery and can be voted on by the community!</p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Who can see this?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {audienceOptions.map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`audience-${option.id}`}
                    name="audience"
                    value={option.id}
                    checked={audience === option.id}
                    onChange={() => setAudience(option.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`audience-${option.id}`}>{option.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Feature in
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-gallery"
                  checked={features.includes('gallery')}
                  onChange={() => handleFeatureChange('gallery')}
                  className="mr-2"
                />
                <label htmlFor="feature-gallery">Gallery</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-lookbook"
                  checked={features.includes('lookbook')}
                  onChange={() => handleFeatureChange('lookbook')}
                  className="mr-2"
                />
                <label htmlFor="feature-lookbook">Lookbook</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="feature-trends"
                  checked={features.includes('trends')}
                  onChange={() => handleFeatureChange('trends')}
                  className="mr-2"
                />
                <label htmlFor="feature-trends">Trends</label>
              </div>
              {uploadType === 'battle' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-battle"
                    checked={features.includes('battle')}
                    onChange={() => handleFeatureChange('battle')}
                    className="mr-2"
                    disabled
                  />
                  <label htmlFor="feature-battle">Battle (automatically included)</label>
                </div>
              )}
              {uploadType === 'opinion' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-opinion"
                    checked={features.includes('opinion')}
                    onChange={() => handleFeatureChange('opinion')}
                    className="mr-2"
                    disabled
                  />
                  <label htmlFor="feature-opinion">Opinion (automatically included)</label>
                </div>
              )}
              {uploadType === 'yayornay' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feature-yayornay"
                    checked={features.includes('yayornay')}
                    onChange={() => handleFeatureChange('yayornay')}
                    className="mr-2"
                    disabled
                  />
                  <label htmlFor="feature-yayornay">Yay or Nay (automatically included)</label>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={uploading || !file}
          className={`w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
            (uploading || !file) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Look'}
        </button>
      </form>
    </div>
  );
}
