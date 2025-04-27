'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { generateAffiliateLink } from '@/utils/affiliate-link-generator';
import Image from 'next/image';

interface SponsoredPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  product_id?: string;
  product_name?: string;
  brand_name?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected';
  created_at: string;
  publish_date?: string;
  expiry_date?: string;
  disclosure_text: string;
  affiliate_link?: string;
  campaign_id?: string;
  campaign_name?: string;
  compensation_type: 'monetary' | 'product' | 'affiliate' | 'mixed';
  compensation_amount?: number;
  content_type: 'video' | 'image' | 'text' | 'mixed';
  target_platforms: string[];
  performance_stats?: any;
  content_links?: string[];
  image_url?: string;
}

export default function SponsoredContent() {
  const { user } = useAuth();
  const { wardrobeItems } = useWardrobe();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sponsoredPosts, setSponsoredPosts] = useState<SponsoredPost[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [showPostDialog, setShowPostDialog] = useState<boolean>(false);
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');
  const [contentType, setContentType] = useState<string>('image');
  const [disclosureText, setDisclosureText] = useState<string>('This post contains affiliate links. I may earn a commission on purchases made through these links.');
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);
  const [isAddingAffiliateLink, setIsAddingAffiliateLink] = useState<boolean>(true);
  const [selectedWardrobeItems, setSelectedWardrobeItems] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchSponsoredContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabaseClient();
        
        // Fetch sponsored posts
        const { data: postsData, error: postsError } = await supabase
          .from('sponsored_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (postsError) {
          console.error('Error fetching sponsored posts:', postsError);
          setError('Failed to load sponsored content');
          return;
        }
        
        setSponsoredPosts(postsData || []);
        
        // Fetch available campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('sponsor_campaigns')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
        } else {
          setCampaigns(campaignsData || []);
        }
      } catch (err) {
        console.error('Error fetching sponsored content:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSponsoredContent();
  }, [user]);
  
  const handleCreatePost = async () => {
    if (!user?.id) return;
    
    setIsCreatingPost(true);
    
    try {
      const supabase = getSupabaseClient();
      
      let affiliateLink = '';
      if (isAddingAffiliateLink && productId) {
        try {
          affiliateLink = await generateAffiliateLink(user.id, productId, 'sponsored_post');
        } catch (err) {
          console.error('Error generating affiliate link:', err);
        }
      }
      
      // Create the new sponsored post
      const { data, error } = await supabase
        .from('sponsored_posts')
        .insert({
          user_id: user.id,
          title,
          description,
          product_id: productId || null,
          status: campaignId ? 'pending_approval' : 'draft',
          created_at: new Date().toISOString(),
          disclosure_text: disclosureText,
          affiliate_link: affiliateLink,
          campaign_id: campaignId || null,
          compensation_type: campaignId ? 'mixed' : 'affiliate',
          content_type: contentType,
          target_platforms: platforms,
          content_links: [],
          wardrobe_items: selectedWardrobeItems
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating sponsored post:', error);
        setError('Failed to create sponsored post');
        return;
      }
      
      // Add the new post to the list
      setSponsoredPosts(prev => [data, ...prev]);
      
      // Reset form
      resetForm();
      setShowPostDialog(false);
    } catch (err) {
      console.error('Error in create post:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsCreatingPost(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProductId('');
    setCampaignId('');
    setContentType('image');
    setDisclosureText('This post contains affiliate links. I may earn a commission on purchases made through these links.');
    setPlatforms(['instagram']);
    setIsAddingAffiliateLink(true);
    setSelectedWardrobeItems([]);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending_approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline">Approved</Badge>;
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return <div className="p-6 text-center">{error}</div>;
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Sponsored Content</h1>
          <p className="text-muted-foreground">Create and manage your sponsored posts and campaigns</p>
        </div>
        <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
          <DialogTrigger asChild>
            <Button>Create New Post</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Sponsored Post</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new sponsored post
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Summer Style Essentials" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Share what your sponsored post is about..."
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (No specific product)</SelectItem>
                    {/* This would be populated from your product database */}
                    <SelectItem value="product-1">Summer Dress - Fashion Brand</SelectItem>
                    <SelectItem value="product-2">Casual Sneakers - Shoe Brand</SelectItem>
                    <SelectItem value="product-3">Tote Bag - Accessories Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Personal Content)</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} - {campaign.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Photo/Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="mixed">Mixed Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="disclosure">Disclosure Text</Label>
                <Textarea 
                  id="disclosure" 
                  value={disclosureText} 
                  onChange={(e) => setDisclosureText(e.target.value)} 
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Required disclosure for sponsored content as per FTC guidelines
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  id="affiliate" 
                  checked={isAddingAffiliateLink} 
                  onCheckedChange={setIsAddingAffiliateLink} 
                />
                <Label htmlFor="affiliate">Include affiliate link</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost} disabled={isCreatingPost || !title}>
                {isCreatingPost ? <LoadingSpinner /> : 'Create Post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {sponsoredPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sponsoredPosts.map((post) => (
            <Card key={post.id}>
              {post.image_url && (
                <div className="relative h-40 overflow-hidden">
                  <Image 
                    src={post.image_url} 
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  {getStatusBadge(post.status)}
                </div>
                <CardDescription>{formatDate(post.created_at)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{post.description}</p>
                
                <div className="mt-4 space-y-2">
                  {post.campaign_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Campaign:</span>
                      <span>{post.campaign_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{post.content_type}</span>
                  </div>
                  
                  {post.compensation_type && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Compensation:</span>
                      <span className="capitalize">{post.compensation_type}</span>
                    </div>
                  )}
                  
                  {post.target_platforms && post.target_platforms.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Platforms:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {post.target_platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="capitalize">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Edit</Button>
                {post.status === 'approved' && (
                  <Button size="sm">Publish</Button>
                )}
                {post.status === 'draft' && (
                  <Button size="sm">Submit for Approval</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/10">
          <h3 className="mb-2 text-xl font-semibold">No Sponsored Content Yet</h3>
          <p className="mb-6 text-muted-foreground">
            Create your first sponsored post to start monetizing your fashion content
          </p>
          <Button onClick={() => setShowPostDialog(true)}>Create Your First Post</Button>
        </div>
      )}
    </div>
  );
}