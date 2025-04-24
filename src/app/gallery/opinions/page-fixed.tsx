'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { fetchOpinionLooks, fetchOpinionsForLook, addOpinionToLook } from "@/lib/fix-opinions-fetch";

interface OpinionItem {
  look_id: string;
  image_url: string;
  caption: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  comments?: Array<{
    id: string;
    text: string;
    username: string;
    avatar_url?: string;
    tags?: string[];
    created_at: string;
  }>;
}

export default function OpinionsPage() {
  const [items, setItems] = useState<OpinionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [commentTags, setCommentTags] = useState<Record<string, string[]>>({});
  const [newTag, setNewTag] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch opinion looks on initial load and when page changes
  useEffect(() => {
    async function loadOpinionLooks() {
      try {
        setLoading(true);
        const result = await fetchOpinionLooks(page);
        
        if (page === 1) {
          setItems(result.items);
        } else {
          setItems(prev => [...prev, ...result.items]);
        }
        
        setHasMore(result.pagination.has_more);
      } catch (err) {
        console.error('Error loading opinion looks:', err);
        setError('Failed to load opinions. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadOpinionLooks();
  }, [page]);

  // Handle expanding a look to show comments
  const handleExpandItem = async (lookId: string) => {
    if (expandedId === lookId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(lookId);
    
    // Find the item
    const item = items.find(i => i.look_id === lookId);
    
    // If we already have comments, no need to fetch again
    if (item && item.comments && item.comments.length > 0) {
      return;
    }
    
    try {
      const opinions = await fetchOpinionsForLook(lookId);
      
      // Update the item with fetched comments
      setItems(prev => prev.map(item => 
        item.look_id === lookId 
          ? { ...item, comments: opinions } 
          : item
      ));
    } catch (err) {
      console.error('Error fetching opinions for look:', err);
      toast({
        title: "Error",
        description: "Failed to load opinions for this look.",
        variant: "destructive"
      });
    }
  };

  // Handle submitting a new comment
  const handleSubmitComment = async (lookId: string) => {
    if (!comments[lookId]?.trim()) return;
    
    try {
      const success = await addOpinionToLook(
        lookId, 
        comments[lookId], 
        commentTags[lookId] || []
      );
      
      if (success) {
        toast({
          title: "Opinion submitted!",
          description: "Your thoughts have been shared with the community.",
        });
        
        // Reset the form
        setComments(prev => ({
          ...prev,
          [lookId]: ''
        }));
        
        setCommentTags(prev => ({
          ...prev,
          [lookId]: []
        }));
        
        // Refresh comments for this look
        const opinions = await fetchOpinionsForLook(lookId);
        
        setItems(prev => prev.map(item => 
          item.look_id === lookId 
            ? { ...item, comments: opinions } 
            : item
        ));
      } else {
        toast({
          title: "Error",
          description: "Failed to submit your opinion. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error submitting opinion:', err);
      toast({
        title: "Error",
        description: "Failed to submit your opinion. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle adding a tag to a comment
  const handleAddTag = (lookId: string) => {
    if (!newTag[lookId]?.trim()) return;
    
    setCommentTags(prev => ({
      ...prev,
      [lookId]: [...(prev[lookId] || []), newTag[lookId].trim()]
    }));
    
    setNewTag(prev => ({
      ...prev,
      [lookId]: ''
    }));
  };

  // Handle removing a tag from a comment
  const handleRemoveTag = (lookId: string, index: number) => {
    setCommentTags(prev => ({
      ...prev,
      [lookId]: (prev[lookId] || []).filter((_, i) => i !== index)
    }));
  };

  // Handle loading more items
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading opinions...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-16">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4 max-w-md mx-auto">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <main className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Fashion Opinions</h1>
        
        {items.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No opinion looks available yet.</p>
            <Button asChild>
              <a href="/look/opinions">Upload an Opinion Look</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map(item => (
              <Card key={item.look_id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img
                        src={item.image_url}
                        alt={item.caption}
                        className="w-full h-full object-cover aspect-square md:aspect-auto"
                      />
                    </div>
                    
                    <div className="p-4 md:w-2/3">
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={item.avatar_url || "https://i.pravatar.cc/150"} 
                          alt={item.username} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium">{item.username}</span>
                      </div>
                      
                      <p className="mb-6">{item.caption}</p>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleExpandItem(item.look_id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>
                          {expandedId === item.look_id ? 'Hide Comments' : 'View Comments'} 
                          {item.comments?.length ? ` (${item.comments.length})` : ''}
                        </span>
                      </Button>
                      
                      {expandedId === item.look_id && (
                        <div className="mt-4">
                          <div className="bg-muted p-3 rounded-lg mb-4 max-h-60 overflow-y-auto">
                            {!item.comments || item.comments.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No opinions yet. Be the first to comment!
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {item.comments.map(comment => (
                                  <div key={comment.id} className="bg-background p-3 rounded-md">
                                    <div className="flex items-start gap-2">
                                      <img 
                                        src={comment.avatar_url || "https://i.pravatar.cc/150"} 
                                        alt={comment.username} 
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-medium text-sm">{comment.username}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm mb-2">{comment.text}</p>
                                        {comment.tags && comment.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {comment.tags.map((tag, i) => (
                                              <Badge key={i} variant="secondary" className="text-xs">
                                                #{tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Share your thoughts on this look..."
                              value={comments[item.look_id] || ''}
                              onChange={(e) => setComments(prev => ({
                                ...prev,
                                [item.look_id]: e.target.value
                              }))}
                              className="w-full resize-none"
                            />
                            
                            <div>
                              <p className="text-sm mb-2">Add tags (optional):</p>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  placeholder="e.g. casual, summer"
                                  value={newTag[item.look_id] || ''}
                                  onChange={(e) => setNewTag(prev => ({
                                    ...prev,
                                    [item.look_id]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddTag(item.look_id);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAddTag(item.look_id)}
                                  disabled={!newTag[item.look_id]?.trim()}
                                >
                                  Add
                                </Button>
                              </div>
                              
                              {(commentTags[item.look_id]?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {(commentTags[item.look_id] || []).map((tag, i) => (
                                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                                      #{tag}
                                      <button
                                        onClick={() => handleRemoveTag(item.look_id, i)}
                                        className="hover:text-destructive ml-1 text-xs"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              className="w-full flex items-center justify-center gap-2"
                              disabled={!comments[item.look_id]?.trim()}
                              onClick={() => handleSubmitComment(item.look_id)}
                            >
                              <Send className="h-4 w-4" />
                              Submit Opinion
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
} 