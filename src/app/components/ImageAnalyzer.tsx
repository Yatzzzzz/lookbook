/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';

interface ImageAnalyzerProps {
  onAnalysisComplete: (tags: string[]) => void;
}

export function ImageAnalyzer({ onAnalysisComplete }: ImageAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clean up any created preview URLs when the component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const analyzeImage = () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    // This is a placeholder that simulates an API call
    setTimeout(() => {
      // These are hardcoded placeholder tags
      const placeholderTags = [
        'Casual', 
        'Summer', 
        'T-shirt', 
        'Denim', 
        'Modern'
      ];
      
      onAnalysisComplete(placeholderTags);
      setIsAnalyzing(false);
    }, 1500); // Simulate a delay
  };

  return (
    <div style={{ 
      borderRadius: '8px',
      border: '1px solid #ddd',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold',
        marginBottom: '16px' 
      }}>
        Upload Your Fashion Photo
      </h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label 
          htmlFor="file-upload" 
          style={{
            display: 'block',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px',
                margin: '0 auto',
                borderRadius: '4px'
              }} 
            />
          ) : (
            <div>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#666" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ margin: '0 auto 16px' }}
              >
                <path d="M21 14h-3a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H18"></path>
                <path d="M3 14h3a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H4.5a1.5 1.5 0 0 0-1.5 1.5v1A1.5 1.5 0 0 0 4.5 9H6"></path>
                <path d="M14 8v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2"></path>
                <path d="M3 10v4.5a1.5 1.5 0 0 0 1.5 1.5H6"></path>
                <path d="M21 10v4.5a1.5 1.5 0 0 1-1.5 1.5H18"></path>
              </svg>
              <p style={{ 
                color: '#666', 
                margin: '0',
                fontSize: '0.875rem'
              }}>
                Click to upload or drag and drop
              </p>
              <p style={{ 
                color: '#999', 
                margin: '8px 0 0 0',
                fontSize: '0.75rem'
              }}>
                JPEG, PNG or GIF (max. 5MB)
              </p>
            </div>
          )}
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
        </label>
      </div>
      
      <button 
        onClick={analyzeImage}
        disabled={!selectedFile || isAnalyzing}
        style={{
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '10px 16px',
          fontSize: '0.875rem',
          fontWeight: 'medium',
          cursor: selectedFile ? 'pointer' : 'not-allowed',
          opacity: selectedFile ? 1 : 0.7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          transition: 'all 0.2s'
        }}
      >
        {isAnalyzing ? (
          <>
            <svg 
              className="animate-spin" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '8px' }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          'Analyze with AI'
        )}
      </button>
    </div>
  );
} 