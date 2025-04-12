'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TestConnection() {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('Checking database...');
  const [storageStatus, setStorageStatus] = useState<string>('Checking storage...');
  const [buckets, setBuckets] = useState<string[]>([]);
  // Removed unused state 'config'

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase URL or key is missing in environment variables');
        }
        
        setStatus('Initializing Supabase client...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check DB connection first
        try {
          setDbStatus('Testing database connection...');
          const { error: tableError } = await supabase
            .from('looks')
            .select('count()', { count: 'exact', head: true });
          
          if (tableError) {
            setDbStatus(`Database error: ${tableError.message}`);
          } else {
            setDbStatus('Database connection successful ✅');
          }
        } catch (dbErr: unknown) {
          if (dbErr instanceof Error) {
            setDbStatus(`Database connection failed: ${dbErr.message}`);
          } else {
            setDbStatus('Database connection failed due to an unexpected error');
          }
        }
        
        // Now check storage
        try {
          setStorageStatus('Testing storage access...');
          
          // Try direct storage API first
          const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
          
          if (bucketsError) {
            setStorageStatus(`Storage API error: ${bucketsError.message}`);
            throw bucketsError;
          }
          
          const bucketNames = bucketsData.map(bucket => bucket.name);
          setBuckets(bucketNames);
          
          if (bucketNames.length === 0) {
            setStorageStatus('Storage connection successful, but no buckets found');
          } else {
            setStorageStatus(`Storage connection successful! Found buckets: ${bucketNames.join(', ')}`);
          }
          
          // Try to directly access the 'looks' bucket
          const { error: filesError } = await supabase.storage
            .from('looks')
            .list();
            
          if (filesError) {
            setStorageStatus(prev => `${prev}\nDirect 'looks' bucket access error: ${filesError.message}`);
          } else {
            setStorageStatus(prev => `${prev}\nDirect 'looks' bucket access successful ✅`);
          }
          
        } catch (storageErr: unknown) {
          if (storageErr instanceof Error) {
            setStorageStatus(`Storage API failed: ${storageErr.message}`);
          } else {
            setStorageStatus('Storage API failed due to an unexpected error');
          }
        }
        
        setStatus('Connection tests completed');
      } catch (error: unknown) {
        if (error instanceof Error) {
          setStatus('Connection initialization failed ❌');
          setError(error.message || 'Unknown error occurred');
          console.error('Supabase connection error:', error);
        } else {
          setStatus('Connection initialization failed due to an unexpected error');
          setError('An unexpected error occurred during connection initialization');
        }
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="p-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="font-medium">{status}</p>
      </div>
      
      <div className={`p-4 mb-4 rounded-md ${dbStatus.includes('successful') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        <p className="font-medium">Database: {dbStatus}</p>
      </div>
      
      <div className={`p-4 mb-4 rounded-md ${storageStatus.includes('successful') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        <p className="font-medium">Storage: {storageStatus}</p>
        <pre className="mt-2 text-sm whitespace-pre-wrap">{storageStatus.split('\n').slice(1).join('\n')}</pre>
      </div>
      
      {buckets.length > 0 && (
        <div className="p-4 mb-4 bg-blue-100 text-blue-800 rounded-md">
          <p className="font-medium mb-2">Available Storage Buckets:</p>
          <ul className="list-disc pl-5">
            {buckets.map(bucket => (
              <li key={bucket}>{bucket}</li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-800 rounded-md">
          <p className="font-medium mb-2">Error Details:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
        <h2 className="text-lg font-medium mb-2">Environment Configuration</h2>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') ? '✅ Set' : '❌ Not properly set'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} characters)` : '❌ Not set'}</p>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-4">
        <h2 className="text-lg font-medium mb-2">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check that your Supabase anonymous key has storage access permissions</li>
          <li>Try reinstalling the Supabase client: <code>npm install @supabase/supabase-js@latest</code></li>
          <li>Ensure your bucket has the correct policies (which looks like it does from your screenshot)</li>
          <li>Try restarting your development server after making any changes</li>
        </ol>
      </div>
      
      {/* Add manual test section */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-4">
        <h2 className="text-lg font-medium mb-2">Manual Storage Test</h2>
        <p className="mb-2">Copy this code to your browser console to test directly:</p>
        <pre className="bg-black text-green-400 p-3 rounded text-sm overflow-x-auto">
{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "${process.env.NEXT_PUBLIC_SUPABASE_URL}",
  "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
);

// Test buckets list
supabase.storage.listBuckets().then(console.log).catch(console.error);

// Test looks bucket directly
supabase.storage.from('looks').list().then(console.log).catch(console.error);`}
        </pre>
      </div>
    </div>
  );
}
