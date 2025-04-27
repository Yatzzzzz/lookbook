'use client';

import { useState, useEffect, useRef } from 'react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Input } from "@/components/ui/input";
import { SendIcon, RefreshCw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ProductMatchingPage() {
  const router = useRouter();
  const { 
    wardrobeItems,
    fetchSimilarProducts,
    trackProductClick,
    addToWishList
  } = useWardrobe();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState<{[key: string]: boolean}>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  // AI Assistant related state
  const [userQuery, setUserQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [predefinedQueries, setPredefinedQueries] = useState<string[]>([
    "What are the best sustainable alternatives to this product?",
    "Find me similar products in a lower price range",
    "Are there similar products with better quality?",
    "How does this compare to other brands?",
    "What would go well with this item?",
  ]);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wardrobeItems.length > 0) {
      // Get unique categories
      const uniqueCategories = Array.from(new Set(wardrobeItems.map(item => item.category)));
      setCategories(uniqueCategories);
    }
  }, [wardrobeItems]);

  useEffect(() => {
    if (selectedItemId) {
      const item = wardrobeItems.find(item => item.item_id === selectedItemId);
      setSelectedItem(item || null);
      
      fetchMatchingProducts(selectedItemId);
    }
  }, [selectedItemId, wardrobeItems]);
  
  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const fetchMatchingProducts = async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const products = await fetchSimilarProducts(itemId, 12);
      setSimilarProducts(products);
    } catch (err) {
      setError('Error fetching similar products. Please try again.');
      console.error('Error fetching similar products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleCategorySelect = (category: string) => {
    // Select the first item from the selected category
    const firstItemInCategory = wardrobeItems.find(item => item.category === category);
    if (firstItemInCategory) {
      setSelectedItemId(firstItemInCategory.item_id);
    }
  };

  const handleProductClick = (productId: string) => {
    trackProductClick(productId, 'product_matching');
    router.push(`/marketplace/product/${productId}`);
  };

  const handleAddToWishlist = async (productId: string) => {
    setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addToWishList(productId);
      // Success notification could be added here
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };
  
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userQuery.trim()) return;
    
    // Add user message to chat
    const newUserMessage = { role: 'user' as const, content: userQuery };
    setChatHistory(prev => [...prev, newUserMessage]);
    
    // Clear input and set loading state
    setUserQuery('');
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Get product context if available
      const productContext = selectedItem ? {
        id: selectedItem.item_id,
        name: selectedItem.name,
        brand: selectedItem.brand,
        category: selectedItem.category,
        color: selectedItem.color,
        style: selectedItem.style,
        material: selectedItem.material
      } : null;
      
      // List of similar products for better context
      const productsList = similarProducts.length > 0 ? 
        similarProducts.slice(0, 5).map(p => ({
          id: p.product_id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          category: p.category
        })) : [];
      
      // Call the Azure OpenAI API
      const response = await fetch('/api/product-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          product: productContext,
          userContext: {
            similarProducts: productsList,
            recentlyViewed: []
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.userFriendlyError || 'Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
      
    } catch (err: any) {
      console.error('Error getting AI response:', err);
      setAiError(err.message || 'Error communicating with AI assistant');
      
      // Add error message to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `I'm sorry, I encountered an error: ${err.message || 'Could not process your request'}` 
      }]);
    } finally {
      setAiLoading(false);
    }
  };
  
  const handlePredefinedQuery = (query: string) => {
    // First set the query in the input field
    setUserQuery(query);
    
    // Then manually trigger the submission with the selected query
    const newUserMessage = { role: 'user' as const, content: query };
    setChatHistory(prev => [...prev, newUserMessage]);
    
    // Set loading state
    setAiLoading(true);
    setAiError(null);
    
    // Submit the query to the AI API
    (async () => {
      try {
        // Get product context if available
        const productContext = selectedItem ? {
          id: selectedItem.item_id,
          name: selectedItem.name,
          brand: selectedItem.brand,
          category: selectedItem.category,
          color: selectedItem.color,
          style: selectedItem.style,
          material: selectedItem.material
        } : null;
        
        // List of similar products for better context
        const productsList = similarProducts.length > 0 ? 
          similarProducts.slice(0, 5).map(p => ({
            id: p.product_id,
            name: p.name,
            brand: p.brand,
            price: p.price,
            category: p.category
          })) : [];
        
        // Call the Azure OpenAI API
        const response = await fetch('/api/product-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            product: productContext,
            userContext: {
              similarProducts: productsList,
              recentlyViewed: []
            }
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.userFriendlyError || 'Failed to get AI response');
        }
        
        const data = await response.json();
        
        // Add AI response to chat
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.response 
        }]);
        
        // Clear the input field after submission
        setUserQuery('');
        
      } catch (err: any) {
        console.error('Error getting AI response:', err);
        setAiError(err.message || 'Error communicating with AI assistant');
        
        // Add error message to chat
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, I encountered an error: ${err.message || 'Could not process your request'}` 
        }]);
      } finally {
        setAiLoading(false);
      }
    })();
  };
  
  const clearChat = () => {
    setChatHistory([]);
    setAiError(null);
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Product Matching</h1>
        <p className="text-muted-foreground">Find products similar to items in your wardrobe</p>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="visual" className="flex-1 py-2">Visual Matching</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex-1 py-2">AI Assistant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual">
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-12">
            <Card className="col-span-1 md:col-span-3">
              <CardHeader>
                <CardTitle>Your Wardrobe</CardTitle>
                <CardDescription>Select an item to find similar products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 text-sm font-medium">Filter by Category</label>
                    <Select onValueChange={handleCategorySelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <label className="mb-2 text-sm font-medium">Items</label>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {wardrobeItems.length > 0 ? (
                        wardrobeItems
                          .filter(item => !selectedItemId || selectedItem?.category === item.category)
                          .map(item => (
                            <div 
                              key={item.item_id}
                              className={`p-2 border rounded-md cursor-pointer flex items-center gap-3 transition-colors ${
                                selectedItemId === item.item_id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => handleItemSelect(item.item_id)}
                            >
                              {item.image_path && (
                                <div className="relative flex-shrink-0 w-12 h-12 overflow-hidden rounded-md">
                                  <Image 
                                    src={item.image_path} 
                                    alt={item.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="p-4 text-center text-muted-foreground">
                          No wardrobe items found. Add items to your wardrobe to use this feature.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/wardrobe">Go to Wardrobe</Link>
                </Button>
              </CardFooter>
            </Card>

            <div className="col-span-1 md:col-span-9">
              {selectedItem ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4 md:flex-row">
                        {selectedItem.image_path && (
                          <div className="relative flex-shrink-0 w-full h-64 overflow-hidden rounded-md md:w-64">
                            <Image 
                              src={selectedItem.image_path} 
                              alt={selectedItem.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                          {selectedItem.brand && (
                            <p className="text-muted-foreground">{selectedItem.brand}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge>{selectedItem.category}</Badge>
                            {selectedItem.style && <Badge variant="outline">{selectedItem.style}</Badge>}
                            {selectedItem.color && <Badge variant="secondary">{selectedItem.color}</Badge>}
                          </div>
                          {selectedItem.description && (
                            <p className="mt-4">{selectedItem.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <h2 className="mb-4 text-2xl font-bold">Similar Products</h2>
                    
                    {isLoading ? (
                      <div className="flex justify-center p-12">
                        <LoadingSpinner />
                      </div>
                    ) : error ? (
                      <div className="p-6 text-center border rounded-lg bg-destructive/10 text-destructive">
                        {error}
                      </div>
                    ) : similarProducts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {similarProducts.map((product) => (
                          <Card key={product.product_id} className="overflow-hidden">
                            <div className="relative h-48">
                              <Image 
                                src={product.image_url || '/images/placeholder-product.jpg'} 
                                alt={product.name}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                              <CardDescription>{product.brand}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="font-semibold">{formatPrice(product.price)}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="outline">{product.category}</Badge>
                                {product.tags && product.tags.slice(0, 2).map((tag: string) => (
                                  <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                              </div>
                            </CardContent>
                            <CardFooter className="grid gap-2 p-4 pt-0">
                              <Button 
                                onClick={() => handleProductClick(product.product_id)}
                                className="w-full"
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleAddToWishlist(product.product_id)}
                                disabled={addingToWishlist[product.product_id]}
                                className="w-full"
                              >
                                {addingToWishlist[product.product_id] ? (
                                  <LoadingSpinner size={16} />
                                ) : (
                                  'Add to Wishlist'
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border rounded-lg">
                        No similar products found for this item.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-center border rounded-lg bg-muted/20">
                  <div className="max-w-md p-6">
                    <h3 className="text-xl font-bold">Select an Item</h3>
                    <p className="mt-2 text-muted-foreground">
                      Choose an item from your wardrobe to find similar products.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-assistant">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6">
            <div className="order-2 md:order-1 md:col-span-3">
              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle>AI Fashion Assistant</CardTitle>
                  <CardDescription>Ask questions about products and get personalized recommendations</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Suggested Questions</h3>
                      <div className="space-y-2">
                        {predefinedQueries.map((query, index) => (
                          <Button 
                            key={index} 
                            variant="outline" 
                            className="w-full justify-start text-left text-sm h-auto py-3 px-3 touch-manipulation"
                            onClick={() => handlePredefinedQuery(query)}
                          >
                            {query}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedItem && (
                      <div className="mt-4">
                        <h3 className="mb-2 text-sm font-medium">Selected Item</h3>
                        <div className="p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            {selectedItem.image_path && (
                              <div className="relative flex-shrink-0 w-12 h-12 overflow-hidden rounded-md">
                                <Image 
                                  src={selectedItem.image_path} 
                                  alt={selectedItem.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{selectedItem.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{selectedItem.brand}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full" 
                        onClick={clearChat}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Chat History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="order-1 md:order-2 md:col-span-9">
              <Card className="flex flex-col h-[500px] md:h-[600px]">
                <CardHeader className="p-3 border-b sm:p-4">
                  <CardTitle>Fashion AI Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[380px] md:h-[450px] px-3 py-3 md:px-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-6 mb-4 rounded-full bg-primary/10">
                          <Image 
                            src="/images/ai-assistant.svg" 
                            alt="AI Assistant" 
                            width={60} 
                            height={60} 
                          />
                        </div>
                        <h3 className="text-xl font-bold">Fashion AI Assistant</h3>
                        <p className="max-w-md mt-2 text-muted-foreground">
                          Ask about products, style advice, or find alternatives to items in your wardrobe.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((message, index) => (
                          <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-muted flex items-center gap-2">
                              <LoadingSpinner size={16} />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-3 sm:p-4 border-t">
                  <form onSubmit={handleQuerySubmit} className="flex w-full gap-2">
                    <Input 
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Ask about fashion, products, or style advice..."
                      className="flex-1 h-10 md:h-auto"
                      disabled={aiLoading}
                    />
                    <Button 
                      type="submit" 
                      disabled={!userQuery.trim() || aiLoading}
                      className="h-10 w-12 p-0 sm:p-2"
                    >
                      <SendIcon className="w-5 h-5" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                </CardFooter>
              </Card>
              {aiError && (
                <div className="p-4 mt-4 text-sm border rounded-md bg-destructive/10 text-destructive">
                  Error: {aiError}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}