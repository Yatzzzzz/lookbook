'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Link, AlertCircle, Loader2, Globe, Check } from 'lucide-react';

interface ProductMetadata {
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  color?: string;
  price?: string;
  image_url?: string;
  material?: string;
  url?: string;
}

interface WebImageImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: ProductMetadata) => void;
}

export function WebImageImporter({ isOpen, onClose, onProductFound }: WebImageImporterProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productMetadata, setProductMetadata] = useState<ProductMetadata | null>(null);
  const [validUrl, setValidUrl] = useState(false);

  const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[^\s]*)?$/;

  const validateUrl = (input: string) => {
    const isValid = urlPattern.test(input);
    setValidUrl(isValid);
    return isValid;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    validateUrl(input);
    setError(null);
  };

  const extractMetadata = async () => {
    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/wardrobe/web-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import from URL');
      }

      const data = await response.json();
      setProductMetadata(data);
    } catch (err: any) {
      console.error('Error importing from URL:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (productMetadata) {
      onProductFound(productMetadata);
      onClose();
    }
  };

  const resetForm = () => {
    setUrl('');
    setProductMetadata(null);
    setError(null);
    setValidUrl(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-auto">
          <Dialog.Title className="m-0 font-medium text-lg mb-4">
            Import from Web
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!productMetadata ? (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="url-input" className="text-sm text-gray-600 dark:text-gray-400">
                    Enter a product URL from a supported retailer
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Globe size={16} className="text-gray-400" />
                    </div>
                    <input
                      id="url-input"
                      type="url"
                      value={url}
                      onChange={handleUrlChange}
                      className="pl-10 w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://www.example.com/product"
                    />
                    {validUrl && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Check size={16} className="text-green-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supported retailers: ASOS, H&M, Zara, Nordstrom, Amazon Fashion
                  </p>
                </div>

                <button
                  onClick={extractMetadata}
                  disabled={isLoading || !validUrl}
                  className={`w-full mt-2 px-4 py-2 rounded transition-colors ${
                    isLoading || !validUrl
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Extracting...
                    </span>
                  ) : (
                    'Extract Product Info'
                  )}
                </button>
              </>
            ) : (
              <div className="border rounded-md p-4 dark:border-gray-700">
                <div className="flex gap-4">
                  {productMetadata.image_url ? (
                    <img
                      src={productMetadata.image_url}
                      alt={productMetadata.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Link size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{productMetadata.name}</h3>
                    {productMetadata.brand && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {productMetadata.brand}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {productMetadata.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {productMetadata.category}
                        </span>
                      )}
                      {productMetadata.color && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {productMetadata.color}
                        </span>
                      )}
                      {productMetadata.price && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {productMetadata.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {productMetadata.description && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {productMetadata.description}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Try Another
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add to Wardrobe
                  </button>
                </div>
              </div>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 