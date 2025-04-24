'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Add export const dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

export default function SimpleUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setError(null);
      setUploading(true);
      log(`Starting upload for ${file.name}`);

      // Generate a simple timestamp-based filename
      const timestamp = Date.now();
      const fileName = `upload_${timestamp}_${file.name}`;
      
      log(`Uploading to looks bucket as ${fileName}`);
      
      // Try the upload
      const { error: uploadError } = await supabase.storage
        .from('looks')
        .upload(fileName, file);
      
      if (uploadError) {
        log(`Upload error: ${uploadError.message}`);
        throw uploadError;
      }
      
      log('Upload successful, getting public URL');
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('looks')
        .getPublicUrl(fileName);
      
      log(`Public URL: ${publicUrl}`);
      setImageUrl(publicUrl);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Upload error:', err);
        setError(err.message);
      } else {
        console.error('An unexpected error occurred:', err);
        setError('An unexpected error occurred during upload');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Simple Upload Test</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded shadow-md p-6 mb-6">
        <input 
          type="file"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {imageUrl && (
        <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
          <p className="font-medium">Upload Successful!</p>
          <a 
            href={imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {imageUrl}
          </a>
          
          {imageUrl.match(/\.(jpeg|jpg|gif|png)$/i) && (
            <div className="mt-4">
              <img 
                src={imageUrl} 
                alt="Uploaded file" 
                className="max-w-full h-auto rounded-md" 
              />
            </div>
          )}
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Upload Logs</h2>
          <div className="bg-black text-green-400 p-3 rounded-md overflow-x-auto">
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 