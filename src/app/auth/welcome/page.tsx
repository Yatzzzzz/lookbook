'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default function Welcome() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
          return
        }
        
        setUser(user)
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase.auth])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to Lookbook!
        </h1>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : user ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for signing up, {user.user_metadata?.username || user.email}!
            </p>
            <div className="flex flex-col space-y-4">
              <Link 
                href="/instruments" 
                className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Instruments
              </Link>
              <Link 
                href="/" 
                className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Go to Home Page
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You&apos;re not signed in. Please sign in to continue.
            </p>
            <div className="flex flex-col space-y-4">
              <Link 
                href="/auth/login" 
                className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Create an Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 