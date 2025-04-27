'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAffiliateStats } from '@/utils/affiliate-link-generator';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  BarChart3, 
  ShoppingCart,
  Calendar,
  ArrowRight,
  Copy,
  CheckCircle2,
  Link
} from "lucide-react";

type StatsPeriod = 'day' | 'week' | 'month' | 'year';

interface AffiliateStats {
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversionRate: number;
  topProducts: any[];
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { wardrobeItems, outfits } = useWardrobe();
  
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('month');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  // Check if user is registered as a creator
  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = (await import('@/lib/supabaseClient')).getSupabaseClient();
        
        const { data, error } = await supabase
          .from('creator_profiles')
          .select('id, affiliate_id, commission_rate, approval_status')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking creator status:', error);
          setIsCreator(false);
        } else {
          setIsCreator(data?.approval_status === 'approved');
        }
      } catch (err) {
        console.error('Error in creator status check:', err);
        setError('Failed to check creator status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkCreatorStatus();
  }, [user]);
  
  // Fetch affiliate stats if user is a creator
  useEffect(() => {
    const fetchAffiliateStats = async () => {
      if (!user?.id || !isCreator) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const affiliateStats = await getAffiliateStats(user.id, statsPeriod);
        setStats(affiliateStats);
        
        // Fetch featured items
        const supabase = (await import('@/lib/supabaseClient')).getSupabaseClient();
        
        // Get wardrobe items with affiliate links
        const { data: itemsData, error: itemsError } = await supabase
          .from('wardrobe_items')
          .select('item_id, name, image_path, affiliate_links, category')
          .eq('user_id', user.id)
          .eq('featured', true)
          .not('affiliate_links', 'is', null)
          .limit(5);
        
        if (itemsError) {
          console.error('Error fetching featured items:', itemsError);
        } else {
          setFeaturedItems(itemsData || []);
        }
        
        // Get payment history
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('creator_payments')
          .select('id, amount, created_at, status, period_start, period_end')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (paymentsError) {
          console.error('Error fetching payment history:', paymentsError);
        } else {
          setPaymentHistory(paymentsData || []);
        }
      } catch (err) {
        console.error('Error fetching affiliate stats:', err);
        setError('Failed to load affiliate statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAffiliateStats();
  }, [user, isCreator, statsPeriod]);
  
  const copyLinkToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatTrend = (value: number) => {
    // This would ideally compare with previous period
    // For now we'll just randomly assign for demonstration
    return Math.random() > 0.5 ? 'up' : 'down';
  };
  
  // Calculate percentage for payment progress
  const calculatePaymentProgress = () => {
    if (!stats) return 0;
    // Assuming payment threshold is $100
    const threshold = 100;
    const progress = (stats.commission % threshold) / threshold * 100;
    return Math.min(progress, 100);
  };
  
  // Content for when user is not a creator
  const renderCreatorSignup = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <h2 className="mb-4 text-2xl font-bold">Become a Creator</h2>
      <p className="max-w-lg mb-6 text-muted-foreground">
        Join our affiliate program to earn commissions by sharing products from your wardrobe.
        Get rewarded when your followers purchase items you recommend.
      </p>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Creator Application</CardTitle>
          <CardDescription>
            Fill out this form to join our affiliate program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Social Media Handles</label>
              <Input placeholder="Instagram, TikTok, etc." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Follower Count</label>
              <Input type="number" placeholder="Approximate total followers" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Focus</label>
              <Input placeholder="Fashion, lifestyle, etc." />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Apply to Creator Program</Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  // Main dashboard display for approved creators
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return <div className="p-6 text-center">{error}</div>;
  }
  
  if (!isCreator) {
    return renderCreatorSignup();
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-muted-foreground">
          Track your affiliate performance and manage your content
        </p>
      </div>
      
      <div className="mb-6">
        <Tabs defaultValue="month" onValueChange={(value) => setStatsPeriod(value as StatsPeriod)}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Clicks */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clicks</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.clicks.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatTrend(stats?.clicks || 0) === 'up' ? (
                <Badge variant="success" className="flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" /> 5%
                </Badge>
              )}
              <span className="ml-2 text-xs text-muted-foreground">vs. previous {statsPeriod}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversions</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.conversions.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatTrend(stats?.conversions || 0) === 'up' ? (
                <Badge variant="success" className="flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> 8%
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" /> 3%
                </Badge>
              )}
              <span className="ml-2 text-xs text-muted-foreground">vs. previous {statsPeriod}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats?.revenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatTrend(stats?.revenue || 0) === 'up' ? (
                <Badge variant="success" className="flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> 15%
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" /> 7%
                </Badge>
              )}
              <span className="ml-2 text-xs text-muted-foreground">vs. previous {statsPeriod}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Commissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Earnings</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(stats?.commission || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {getStatTrend(stats?.commission || 0) === 'up' ? (
                <Badge variant="success" className="flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> 20%
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" /> 4%
                </Badge>
              )}
              <span className="ml-2 text-xs text-muted-foreground">vs. previous {statsPeriod}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Clicks and conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Mon', clicks: 150, conversions: 12 },
                      { name: 'Tue', clicks: 230, conversions: 18 },
                      { name: 'Wed', clicks: 180, conversions: 14 },
                      { name: 'Thu', clicks: 240, conversions: 20 },
                      { name: 'Fri', clicks: 320, conversions: 25 },
                      { name: 'Sat', clicks: 280, conversions: 22 },
                      { name: 'Sun', clicks: 190, conversions: 15 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="clicks" fill="#8884d8" name="Clicks" />
                    <Bar yAxisId="right" dataKey="conversions" fill="#82ca9d" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
            <CardDescription>Percentage of clicks that convert to purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Converted', value: stats?.conversions || 1 },
                      { name: 'No Purchase', value: (stats?.clicks || 1) - (stats?.conversions || 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    <Cell fill="#82ca9d" />
                    <Cell fill="#8884d8" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg font-medium">
                {(stats?.conversionRate || 0).toFixed(2)}% Conversion Rate
              </p>
              <p className="text-sm text-muted-foreground">
                Industry average: 2.35%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Products generating the most revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Clicks</th>
                    <th className="p-2 text-left">Conversions</th>
                    <th className="p-2 text-left">Revenue</th>
                    <th className="p-2 text-left">Your Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((product) => (
                      <tr key={product.product_id} className="border-b">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.clicks}</td>
                        <td className="p-2">{product.conversions}</td>
                        <td className="p-2">{formatCurrency(product.revenue)}</td>
                        <td className="p-2">{formatCurrency(product.commission)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No product data available yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Earnings Status</CardTitle>
            <CardDescription>Your current balance and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-3">
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.commission || 0)}</p>
              </div>
              <div>
                <p className="flex items-center text-sm font-medium">
                  <Calendar className="w-4 h-4 mr-1" /> 
                  Next Payment
                </p>
                <p className="text-sm text-muted-foreground">1st of next month</p>
              </div>
              <div>
                <p className="mb-1 text-sm">Progress to next payment (minimum $100)</p>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${calculatePaymentProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="mb-2 text-sm font-medium">Recent Payments</h4>
              {paymentHistory.length > 0 ? (
                <div className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex justify-between p-2 text-sm border rounded-md">
                      <div>
                        <p>{formatDate(payment.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge variant={payment.status === 'paid' ? 'success' : 'default'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-sm text-center text-muted-foreground">
                  No payment history yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Featured Items</CardTitle>
            <CardDescription>Create and manage affiliate links for your wardrobe items</CardDescription>
          </CardHeader>
          <CardContent>
            {featuredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Affiliate Link</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featuredItems.map((item) => (
                      <tr key={item.item_id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 overflow-hidden rounded-md bg-muted">
                              {item.image_path && (
                                // Using next/image would be better but simplified for readability
                                <img 
                                  src={item.image_path} 
                                  alt={item.name} 
                                  className="object-cover w-full h-full" 
                                />
                              )}
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2">
                          <div className="max-w-xs truncate">
                            {item.affiliate_links?.url || "No affiliate link"}
                          </div>
                        </td>
                        <td className="p-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyLinkToClipboard(item.affiliate_links?.url)}
                            className="flex items-center gap-1"
                          >
                            {linkCopied ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" /> Copy Link
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="mb-4 text-muted-foreground">No featured items with affiliate links yet</p>
                <Button>Create Your First Affiliate Link</Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {featuredItems.length} of {wardrobeItems.length} items in your wardrobe
            </p>
            <Button variant="outline" className="flex items-center gap-1">
              Manage All Items <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Sponsored Content</CardTitle>
            <CardDescription>Manage your sponsored posts and campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Create New Sponsored Post</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 