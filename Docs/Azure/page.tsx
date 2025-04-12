'use client';
import { useState } from 'react';
import { ImageAnalyzer } from '@/app/components/ImageAnalyzer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { safeStoreItem, safeGetItem } from '@/app/utils/storage';

// Define interface for look items
interface LookItem {
  tags: string[];
  timestamp: number;
  analyzedWith: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [analysisTags, setAnalysisTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const handleAnalysisComplete = (tags: string[]) => {
    setAnalysisTags(tags);
    setSaved(false);
  };

  const saveLook = () => {
    // Implement saving to localStorage similar to the old upload page
    try {
      const saved = safeGetItem('looks');
      const looks: LookItem[] = saved ? JSON.parse(saved) : [];
      
      // Manage storage limit (keep only the 4 most recent if we have 5+)
      if (looks.length >= 5) {
        looks.sort((a: LookItem, b: LookItem) => b.timestamp - a.timestamp);
        looks.length = 4;
      }
      
      // Add the new look without an image (since our new component doesn't save it)
      const newLook: LookItem = { 
        // We don't have an image in this implementation, so we're just storing tags
        tags: analysisTags, 
        timestamp: Date.now(),
        analyzedWith: 'Azure OpenAI'
      };
      
      safeStoreItem('looks', JSON.stringify([...looks, newLook]));
      setSaved(true);
      
      // Automatically redirect after a short delay
      setTimeout(() => {
        router.push('/gallery');
      }, 1500);
    } catch (error) {
      console.error('Failed to save look:', error);
      // Error handling would go here
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/" 
          className="mr-auto inline-flex items-center px-3 py-2 rounded-md text-gray-600 text-sm hover:bg-gray-100"
        >
          <svg 
            className="mr-2" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">
        Analyze Your Fashion
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ImageAnalyzer onAnalysisComplete={handleAnalysisComplete} />
        </div>
        
        {analysisTags.length > 0 && (
          <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold mb-1">
                  Your Fashion Analysis
                </h2>
                <p className="text-gray-600 text-sm">
                  Here's what our AI identified in your image
                </p>
              </div>
              
              <div className="p-4">
                <div className="mb-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Identified Items:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisTags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <hr className="my-4 border-gray-100" />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Recommendations:
                    </h3>
                    <p className="text-sm text-gray-600">
                      Based on your look, you might like to explore these complementary styles.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t border-gray-100 flex justify-between">
                <button 
                  className="inline-flex items-center px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-md text-sm hover:bg-gray-50"
                  onClick={() => {
                    // Placeholder for share functionality
                    navigator.clipboard.writeText(analysisTags.join(', '));
                    alert('Fashion tags copied to clipboard!');
                  }}
                >
                  <svg 
                    className="mr-2" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share
                </button>
                
                <button 
                  onClick={saveLook} 
                  disabled={saved}
                  className={`inline-flex items-center px-4 py-1.5 rounded-md text-sm ${
                    saved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {saved ? 'Saved!' : 'Save to Gallery'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 