'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Skip static generation
export const dynamic = 'force-dynamic';

// Define interface for session data
interface SessionData {
  authenticated: boolean;
  user_record_exists: boolean;
  session?: {
    user: {
      id: string;
      email: string;
      user_metadata?: {
        username?: string;
      };
    };
  };
  userData?: Record<string, unknown>;
}

export default function TestUserSession() {
  const { user, loading: authLoading } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');

  useEffect(() => {
    async function checkSession() {
      if (authLoading) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/test-user-session');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch session data');
        }
        
        setSessionData(data);
      } catch (err) {
        console.error('Error checking session:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, [authLoading, userCreated]);

  const handleCreateUserRecord = async () => {
    try {
      setCreatingUser(true);
      setCreateUserMessage('');
      
      const response = await fetch('/api/user-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user record');
      }
      
      setUserCreated(true);
      setCreateUserMessage(data.message);
    } catch (err) {
      console.error('Error creating user record:', err);
      setCreateUserMessage(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setCreatingUser(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>Checking user session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">User Session Test</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Auth Context State:</h2>
        <div className="p-4 bg-gray-100 rounded-md">
          <p><span className="font-semibold">Authenticated:</span> {user ? 'Yes' : 'No'}</p>
          {user && (
            <>
              <p><span className="font-semibold">User ID:</span> {user.id}</p>
              <p><span className="font-semibold">Email:</span> {user.email}</p>
              <p><span className="font-semibold">Username:</span> {user?.user_metadata?.username || 'N/A'}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">API Session Check:</h2>
        <div className="p-4 bg-gray-100 rounded-md">
          {sessionData ? (
            <>
              <p><span className="font-semibold">Authenticated:</span> {sessionData.authenticated ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold">User Record Exists:</span> {sessionData.user_record_exists ? 'Yes' : 'No'}</p>
              
              {sessionData.session?.user && (
                <>
                  <p><span className="font-semibold">User ID:</span> {sessionData.session.user.id}</p>
                  <p><span className="font-semibold">Email:</span> {sessionData.session.user.email}</p>
                  <p><span className="font-semibold">Username:</span> {sessionData.session.user.user_metadata?.username || 'N/A'}</p>
                </>
              )}
              
              {sessionData.user_record_exists && (
                <div className="mt-4">
                  <p className="font-semibold">User Database Record:</p>
                  <pre className="mt-2 p-2 bg-gray-200 rounded overflow-x-auto">
                    {JSON.stringify(sessionData.userData, null, 2)}
                  </pre>
                </div>
              )}
              
              {!sessionData.user_record_exists && sessionData.authenticated && (
                <div className="mt-4">
                  <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
                    <p className="font-bold">Warning:</p>
                    <p>You are authenticated, but your user record doesn&apos;t exist in the database.</p>
                    <p>This is causing the foreign key constraint error in other parts of the application.</p>
                  </div>
                  
                  <button
                    onClick={handleCreateUserRecord}
                    disabled={creatingUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingUser ? 'Creating...' : 'Create User Record'}
                  </button>
                  
                  {createUserMessage && (
                    <div className={`mt-3 p-3 rounded-md ${userCreated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {createUserMessage}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p>No session data available</p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Link 
          href="/signup" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign Up
        </Link>
        <Link 
          href="/login" 
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Log In
        </Link>
        <Link 
          href="/" 
          className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 