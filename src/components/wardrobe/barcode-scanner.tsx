'use client';

import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Camera, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface BarcodeScannedProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image_url?: string;
  color?: string;
  material?: string;
}

interface BarcodeScannedResult {
  barcode: string;
  format: string;
  product?: BarcodeScannedProduct;
}

interface BarcodeScanner {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: BarcodeScannedProduct) => void;
}

export function BarcodeScanner({ isOpen, onClose, onProductFound }: BarcodeScanner) {
  const [result, setResult] = useState<BarcodeScannedResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Set up the barcode reader
  const { ref } = useZxing({
    onDecodeResult(decodedResult) {
      const barcode = decodedResult.getText();
      const format = decodedResult.getBarcodeFormat().toString();
      
      // Only update if we don't have a result yet or if it's a different barcode
      if (!result || result.barcode !== barcode) {
        setResult({
          barcode,
          format,
        });
        searchProduct(barcode);
      }
    },
    onError(error) {
      console.error('Barcode scanner error:', error);
      setError('Error accessing camera. Please check your permissions and try again.');
    },
  });

  useEffect(() => {
    // Check camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setPermission('granted');
        })
        .catch((err) => {
          console.error('Camera permission error:', err);
          setPermission('denied');
          setError('Camera access denied. Please enable camera permissions in your browser settings.');
        });
    } else {
      setError('Your browser does not support camera access. Please try a different browser.');
    }

    // Cleanup function
    return () => {
      // Reset states when component unmounts
      setResult(null);
      setError(null);
      setIsSearching(false);
    };
  }, []);

  const searchProduct = async (barcode: string) => {
    try {
      setIsSearching(true);
      setError(null);

      const response = await fetch(`/api/wardrobe/product-lookup?barcode=${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`No product found for barcode ${barcode}`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to look up product');
        }
        setIsSearching(false);
        return;
      }

      const product = await response.json();
      
      if (product) {
        setResult((prev) => prev ? { ...prev, product } : null);
        // No need to call onProductFound here - we'll let the user confirm first
      } else {
        setError(`No product found for barcode ${barcode}`);
      }
    } catch (err: any) {
      console.error('Error searching product:', err);
      setError(`Error looking up product: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToWardrobe = () => {
    if (result?.product) {
      onProductFound(result.product);
      onClose();
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white dark:bg-gray-900 p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-auto">
          <Dialog.Title className="m-0 font-medium text-lg mb-4">
            Barcode Scanner
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {permission === 'denied' ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <Camera size={48} className="text-gray-400" />
                </div>
                <h3 className="font-medium mb-2">Camera Access Required</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Please allow camera access in your browser settings to use the barcode scanner.
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {!result ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-black">
                    <video ref={ref} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-4 border-blue-500/50 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white text-sm">
                        Position the barcode within the frame to scan
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 dark:border-gray-700">
                    {isSearching ? (
                      <div className="py-8 flex flex-col items-center">
                        <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Searching for product information...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {result.format}
                            </span>
                            <p className="font-mono text-sm mb-2">{result.barcode}</p>
                          </div>
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            onClick={resetScanner}
                          >
                            <ArrowRight size={18} />
                            <span className="sr-only">Scan again</span>
                          </button>
                        </div>

                        {result.product ? (
                          <div className="mt-4">
                            <div className="flex gap-4">
                              {result.product.image_url && (
                                <img
                                  src={result.product.image_url}
                                  alt={result.product.name}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div>
                                <h3 className="font-medium">{result.product.name}</h3>
                                {result.product.brand && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {result.product.brand}
                                  </p>
                                )}
                                {result.product.category && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Category: {result.product.category}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              onClick={handleAddToWardrobe}
                            >
                              Add to Wardrobe
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400">
                              No product information found for this barcode.
                            </p>
                            <button
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              onClick={resetScanner}
                            >
                              Scan Again
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
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