'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface RatingStats {
  total_looks: number;
  rated_looks: number;
  avg_ratings_per_look: number;
  max_ratings_on_look: number;
  top_rated_count: number;
}

export default function RatingsAdminPage() {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthorized(false);
        setError('You must be logged in to access this page');
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data || data.role !== 'admin') {
        setAuthorized(false);
        setError('You do not have permission to access this page');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setAuthorized(false);
      setError('Authentication error');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/update-ratings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rating stats');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load rating statistics');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load rating statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncRatings = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch('/api/admin/update-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_ratings' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync ratings');
      }
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Ratings synchronized successfully',
          variant: 'default'
        });
        // Refresh stats
        fetchStats();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error syncing ratings:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to synchronize ratings',
        variant: 'destructive'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const recreateTriggers = async () => {
    setTriggerLoading(true);
    try {
      const response = await fetch('/api/admin/update-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recreate_triggers' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recreate triggers');
      }
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Database triggers recreated successfully',
          variant: 'default'
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error recreating triggers:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to recreate database triggers',
        variant: 'destructive'
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Rating System Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Rating Statistics</CardTitle>
            <CardDescription>Overview of user ratings in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-600">
                {error}
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-600">Total Looks</p>
                    <p className="text-2xl font-bold">{stats.total_looks.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="text-sm text-green-600">Rated Looks</p>
                    <p className="text-2xl font-bold">{stats.rated_looks.toLocaleString()}</p>
                    <p className="text-xs text-green-600/70 mt-1">
                      {Math.round((stats.rated_looks / stats.total_looks) * 100) || 0}% of total
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-md">
                    <p className="text-sm text-purple-600">Average Ratings</p>
                    <p className="text-2xl font-bold">{stats.avg_ratings_per_look}</p>
                    <p className="text-xs text-purple-600/70 mt-1">
                      Per rated look
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm text-yellow-600">Top Rated</p>
                    <p className="text-2xl font-bold">{stats.top_rated_count}</p>
                    <p className="text-xs text-yellow-600/70 mt-1">
                      In featured section
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p>No statistics available</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={fetchStats} 
              disabled={loading} 
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Stats
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
            <CardDescription>Tools for managing the rating system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Synchronize Ratings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will update all look rating counts and averages based on individual user ratings.
                  Use this if ratings appear out of sync on the Trends page.
                </p>
                <Button 
                  onClick={syncRatings} 
                  disabled={syncLoading} 
                  className="flex items-center"
                >
                  {syncLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Synchronize All Ratings
                </Button>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Recreate Database Triggers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will recreate the database triggers that keep ratings in sync.
                  Only use if automatic rating updates are not working.
                </p>
                <Button 
                  variant="outline" 
                  onClick={recreateTriggers} 
                  disabled={triggerLoading} 
                  className="flex items-center"
                >
                  {triggerLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Recreate Triggers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 