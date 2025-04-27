'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Camera, Globe, Upload, Package, ChevronRight, ChevronLeft, HelpCircle, Check } from 'lucide-react';
import { BarcodeScanner } from './barcode-scanner';
import { WebImageImporter } from './web-image-importer';
import { WardrobeBasics } from './wardrobe-basics';
import { BatchUpload } from './batch-upload';
import { useWardrobe } from '@/app/context/WardrobeContext';

type OnboardingStep = 'welcome' | 'method' | 'basics' | 'barcode' | 'web' | 'upload' | 'success';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingFlow({ isOpen, onClose }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [previousStep, setPreviousStep] = useState<OnboardingStep | null>(null);
  const [addedItemsCount, setAddedItemsCount] = useState(0);
  
  const { addItem, uploadImage } = useWardrobe();
  
  const goToStep = (nextStep: OnboardingStep) => {
    setPreviousStep(step);
    setStep(nextStep);
  };
  
  const goBack = () => {
    if (previousStep) {
      setStep(previousStep);
      setPreviousStep(null);
    } else {
      // Default fallback if no previous step is recorded
      setStep('welcome');
    }
  };
  
  const handleItemFound = async (item: any) => {
    try {
      // Process the item based on its source
      if (item.image_url) {
        // Item from a web import or barcode scan
        const imageResponse = await fetch(item.image_url);
        const imageBlob = await imageResponse.blob();
        const file = new File([imageBlob], `${item.name.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
        
        // Upload the image
        const uploadedImageUrl = await uploadImage(file);
        
        // Add the item to the wardrobe
        await addItem({
          name: item.name,
          category: item.category || 'other',
          color: item.color || '',
          brand: item.brand || '',
          description: item.description || '',
          image_path: uploadedImageUrl,
          style: item.style || '',
          visibility: 'private'
        });
      } else if (item.image) {
        // Item from wardrobe basics
        // Convert data URL to blob
        const response = await fetch(item.image);
        const blob = await response.blob();
        const file = new File([blob], `${item.name.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
        
        // Upload the image
        const uploadedImageUrl = await uploadImage(file);
        
        // Add the item to the wardrobe
        await addItem({
          name: item.name,
          category: item.category,
          color: item.color || '',
          description: item.description || '',
          image_path: uploadedImageUrl,
          material: item.material || '',
          visibility: 'private'
        });
      } else if (item.file) {
        // Item from batch upload (should be handled in BatchUpload component)
        return;
      } else {
        // Direct data - just add to wardrobe
        await addItem({
          name: item.name || 'Clothing Item',
          category: item.category || 'other',
          color: item.color || '',
          brand: item.brand || '',
          description: item.description || '',
          image_path: item.image_path || '',
          style: item.style || '',
          visibility: 'private'
        });
      }
      
      // Increment the added items count
      setAddedItemsCount(prev => prev + 1);
      
      // Show success screen after adding items
      goToStep('success');
    } catch (error: any) {
      console.error('Error adding item to wardrobe:', error);
      alert(`Error adding item: ${error.message}`);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="py-8 text-center">
            <h3 className="text-2xl font-medium mb-6">Welcome to Your Virtual Wardrobe</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Let's get started by adding some clothing items to your wardrobe. We've made it quick and easy!
            </p>
            <button
              onClick={() => goToStep('method')}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
            >
              Get Started <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        );
        
      case 'method':
        return (
          <div className="py-4">
            <h3 className="text-xl font-medium mb-6 text-center">Choose How to Add Items</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => goToStep('basics')}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-center"
              >
                <div className="flex justify-center mb-4">
                  <Package size={40} className="text-blue-500" />
                </div>
                <h4 className="text-lg font-medium mb-2">Wardrobe Basics</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quickly add common clothing essentials
                </p>
              </button>
              
              <button
                onClick={() => goToStep('barcode')}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-center"
              >
                <div className="flex justify-center mb-4">
                  <Camera size={40} className="text-blue-500" />
                </div>
                <h4 className="text-lg font-medium mb-2">Scan Barcode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan product barcodes with your camera
                </p>
              </button>
              
              <button
                onClick={() => goToStep('web')}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-center"
              >
                <div className="flex justify-center mb-4">
                  <Globe size={40} className="text-blue-500" />
                </div>
                <h4 className="text-lg font-medium mb-2">Import from Web</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add items from retail websites
                </p>
              </button>
              
              <button
                onClick={() => goToStep('upload')}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-center"
              >
                <div className="flex justify-center mb-4">
                  <Upload size={40} className="text-blue-500" />
                </div>
                <h4 className="text-lg font-medium mb-2">Batch Upload</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload multiple photos at once
                </p>
              </button>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={goBack}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronLeft size={16} className="mr-1" /> Back
              </button>
            </div>
          </div>
        );
        
      case 'basics':
        return (
          <WardrobeBasics
            isOpen={true}
            onClose={() => goToStep('method')}
            onItemSelect={handleItemFound}
          />
        );
        
      case 'barcode':
        return (
          <BarcodeScanner
            isOpen={true}
            onClose={() => goToStep('method')}
            onProductFound={handleItemFound}
          />
        );
        
      case 'web':
        return (
          <WebImageImporter
            isOpen={true}
            onClose={() => goToStep('method')}
            onProductFound={handleItemFound}
          />
        );
        
      case 'upload':
        return (
          <BatchUpload
            isOpen={true}
            onClose={() => goToStep('method')}
          />
        );
        
      case 'success':
        return (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium mb-3">Items Added Successfully!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {addedItemsCount} {addedItemsCount === 1 ? 'item has' : 'items have'} been added to your wardrobe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setAddedItemsCount(0);
                  goToStep('method');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Add More Items
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View My Wardrobe
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-auto">
          <div className="min-h-[50vh]">
            {renderStep()}
          </div>
          
          {step !== 'basics' && step !== 'barcode' && step !== 'web' && step !== 'upload' && (
            <Dialog.Close asChild>
              <button
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          )}
          
          {step === 'welcome' && (
            <div className="absolute bottom-4 right-4">
              <button
                className="p-2 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Help"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 