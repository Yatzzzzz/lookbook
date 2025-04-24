'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Define interfaces
interface BattleItem {
  id: string;
  username?: string;
  avatar_url?: string;
  image_url?: string;
  caption?: string;
  option1_url?: string;
  option2_url?: string;
  selectedOption?: number;
  isSaved?: boolean;
}

function BattlePageContent() {
  const { toast } = useToast();
  const [battleItems, setBattleItems] = useState<BattleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageTries, setImageTries] = useState<Record<string, number>>({});
  const [savingItems, setSavingItems] = useState<Record<string, boolean>>({});
  
  const maxRetries = 2;
  // Use client component client for storage operations
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  // Handle image loading errors with retry
  const handleImageError = (imageId: string) => {
    console.error(`Image failed to load: ${imageId}`);
    
    // Increment try count
    const currentTry = imageTries[imageId] || 0;
    const newTries = currentTry + 1;
    
    setImageTries(prev => ({
      ...prev,
      [imageId]: newTries
    }));
    
    // If we haven't exceeded max retries, retry with timestamp to avoid cache
    if (newTries <= maxRetries) {
      console.log(`Retrying image ${imageId}, attempt ${newTries}/${maxRetries}`);
      
      // Wait a short time and force a retry
      setTimeout(() => {
        // Mark as not errored to trigger a re-render with a fresh URL
        setImageErrors(prev => ({
          ...prev,
          [imageId]: false
        }));
      }, 1000 * newTries); // Increasing backoff
    } else {
      // Mark as errored after all retries
      setImageErrors(prev => ({
        ...prev,
        [imageId]: true
      }));
    }
  };

  useEffect(() => {
    async function fetchBattleItems() {
      try {
        setIsLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Please sign in to view battle looks");
          setIsLoading(false);
          return;
        }
        
        // Create battle item
        const battleItem: BattleItem = {
          id: 'battle-item',
          username: user.email?.split('@')[0] || 'user',
          caption: 'Select which option better completes the look:',
        };
        
        try {
          // First, check if we need to look in a user-specific folder
          const userFolder = `user_${user.id.substring(0, 8)}`;
          
          // Try to list files from the user's folder in the battle bucket
          const { data: userFiles, error: userError } = await supabase.storage
            .from('battle')
            .list(userFolder);
            
          if (!userError && userFiles && userFiles.length > 0) {
            console.log(`Files found in user folder ${userFolder}:`, userFiles);
            
            // Find main image and options based on filename patterns
            const mainImage = userFiles.find(file => file.name.includes('main.jpg') || file.name.includes('-main'));
            const option1Image = userFiles.find(file => file.name.includes('option1.jpg') || file.name.includes('-option1'));
            const option2Image = userFiles.find(file => file.name.includes('option2.jpg') || file.name.includes('-option2'));
            
            // Use direct Supabase URLs for images from user folder
            if (mainImage) {
              const { data: mainUrl } = supabase.storage
                .from('battle')
                .getPublicUrl(`${userFolder}/${mainImage.name}`);
              battleItem.image_url = mainUrl.publicUrl;
            }
            
            if (option1Image) {
              const { data: option1Url } = supabase.storage
                .from('battle')
                .getPublicUrl(`${userFolder}/${option1Image.name}`);
              battleItem.option1_url = option1Url.publicUrl;
            }
            
            if (option2Image) {
              const { data: option2Url } = supabase.storage
                .from('battle')
                .getPublicUrl(`${userFolder}/${option2Image.name}`);
              battleItem.option2_url = option2Url.publicUrl;
            }
          } else {
            // Fallback to looking at the root level of the battle bucket
            console.log("No files found in user folder, checking root bucket");
            
            const { data: files, error: listError } = await supabase.storage
              .from('battle')
              .list();
              
            if (listError) {
              console.error("Error listing files:", listError);
              throw new Error("Failed to retrieve battle images");
            }
            
            console.log("Files in battle bucket:", files);
            
            // Find main image and options based on filename patterns
            const mainImage = files?.find(file => file.name.includes('main.jpg') || file.name.includes('-main'));
            const option1Image = files?.find(file => file.name.includes('option1.jpg') || file.name.includes('-option1'));
            const option2Image = files?.find(file => file.name.includes('option2.jpg') || file.name.includes('-option2'));
            
            // Use direct Supabase URLs
            if (mainImage) {
              const { data: mainUrl } = supabase.storage
                .from('battle')
                .getPublicUrl(mainImage.name);
              battleItem.image_url = mainUrl.publicUrl;
            }
            
            if (option1Image) {
              const { data: option1Url } = supabase.storage
                .from('battle')
                .getPublicUrl(option1Image.name);
              battleItem.option1_url = option1Url.publicUrl;
            }
            
            if (option2Image) {
              const { data: option2Url } = supabase.storage
                .from('battle')
                .getPublicUrl(option2Image.name);
              battleItem.option2_url = option2Url.publicUrl;
            }
          }
          
          // If we still haven't found any images, check if the files are in a user-specific bucket
          if (!battleItem.image_url && !battleItem.option1_url && !battleItem.option2_url) {
            const userBucket = `user_${user.id.substring(0, 8)}`;
            
            // Try listing files from a potential user bucket
            const { data: userBucketFiles, error: userBucketError } = await supabase.storage
              .from(userBucket)
              .list();
              
            if (!userBucketError && userBucketFiles && userBucketFiles.length > 0) {
              console.log(`Files found in user bucket ${userBucket}:`, userBucketFiles);
              
              // Find main image and options based on filename patterns
              const mainImage = userBucketFiles.find(file => file.name.includes('main.jpg') || file.name.includes('-main'));
              const option1Image = userBucketFiles.find(file => file.name.includes('option1.jpg') || file.name.includes('-option1'));
              const option2Image = userBucketFiles.find(file => file.name.includes('option2.jpg') || file.name.includes('-option2'));
              
              // Use direct Supabase URLs for user bucket
              if (mainImage) {
                const { data: mainUrl } = supabase.storage
                  .from(userBucket)
                  .getPublicUrl(mainImage.name);
                battleItem.image_url = mainUrl.publicUrl;
              }
              
              if (option1Image) {
                const { data: option1Url } = supabase.storage
                  .from(userBucket)
                  .getPublicUrl(option1Image.name);
                battleItem.option1_url = option1Url.publicUrl;
              }
              
              if (option2Image) {
                const { data: option2Url } = supabase.storage
                  .from(userBucket)
                  .getPublicUrl(option2Image.name);
                battleItem.option2_url = option2Url.publicUrl;
              }
            }
          }
        } catch (listError) {
          console.error("Error getting file list:", listError);
          setError("Failed to load battle images. Please try again later.");
        }
        
        // Only add battleItem if at least one image URL was found
        if (battleItem.image_url || battleItem.option1_url || battleItem.option2_url) {
          setBattleItems([battleItem]);
        } else {
          setError("No battle images found. Please upload images first.");
        }
      } catch (error) {
        console.error("Error fetching battle items:", error);
        setError("Failed to load battle items");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBattleItems();
  }, [supabase]);

  const handleSelection = (battleId: string, optionNumber: number) => {
    // Update selected option
    setBattleItems(prev => prev.map(item => 
      item.id === battleId 
        ? { ...item, selectedOption: optionNumber } 
        : item
    ));

    // Show toast notification
    toast({
      title: "Selection recorded!",
      description: `You selected option ${optionNumber}. Thanks for your input!`,
    });
  };

  // Add a confirmation handler
  const handleConfirmSelection = async (battleId: string) => {
    // Find the battle item
    const battle = battleItems.find(item => item.id === battleId);
    
    if (!battle || !battle.selectedOption) {
      toast({
        title: "No option selected",
        description: "Please select an option first.",
        variant: "destructive"
      });
      return;
    }
    
    // Set saving state
    setSavingItems(prev => ({
      ...prev,
      [battleId]: true
    }));
    
    // Create the selection data object
    const selectionData = {
      battle_id: battleId,
      selected_option: battle.selectedOption,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please sign in to save your selection.",
          variant: "destructive"
        });
        
        // Even without auth, save to localStorage as fallback
        saveToLocalStorage(selectionData);
        
        return;
      }
      
      let savedSuccessfully = false;
      
      try {
        // First try the battle_selections table
        const { error } = await supabase
          .from('battle_selections')
          .upsert({
            user_id: user.id,
            battle_id: battleId,
            selected_option: battle.selectedOption,
            created_at: new Date().toISOString(),
          });
          
        if (!error) {
          savedSuccessfully = true;
          console.log("Successfully saved to battle_selections table");
        } else {
          console.log("Could not save to battle_selections table:", error);
        }
      } catch (error) {
        console.log("Error with battle_selections table:", error);
      }
      
      // If first approach failed, try the profiles table
      if (!savedSuccessfully) {
        try {
          // Try updating the user's profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              [`battle_selections:${battleId}`]: battle.selectedOption
            })
            .eq('id', user.id);
            
          if (!profileError) {
            savedSuccessfully = true;
            console.log("Successfully saved to profiles table");
          } else {
            console.log("Could not save to profiles table:", profileError);
          }
        } catch (error) {
          console.log("Error with profiles table:", error);
        }
      }
      
      // If both database approaches failed, save to localStorage
      if (!savedSuccessfully) {
        saveToLocalStorage(selectionData);
      }
      
      // Show success toast notification
      toast({
        title: "Selection saved!",
        description: `You selected option ${battle.selectedOption}. Thanks for your input!`,
      });
      
      // Optional: Update UI to show it's been saved
      setBattleItems(prev => prev.map(item => 
        item.id === battleId 
          ? { ...item, isSaved: true } 
          : item
      ));
      
      // Optional: Hide the card or show "Thank you" message after a delay
      setTimeout(() => {
        setBattleItems(prev => prev.filter(item => item.id !== battleId));
        
        // If no more items, show a message
        if (battleItems.length <= 1) {
          setError("Thank you for your selections! Check back later for more battles.");
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error in handleConfirmSelection:", error);
      
      // Even if there's an error, try to save to localStorage
      saveToLocalStorage(selectionData);
      
      // Show error message with more details to help debugging
      toast({
        title: "Selection saved locally",
        description: "We couldn't save to the server, but your selection was saved locally.",
        variant: "default"
      });
      
      // Reset saving state on error
      setSavingItems(prev => ({
        ...prev,
        [battleId]: false
      }));
    }
  };
  
  // Helper function to save to localStorage
  const saveToLocalStorage = (data: any) => {
    try {
      // Get existing selections
      const existingData = localStorage.getItem('battle_selections');
      const selections = existingData ? JSON.parse(existingData) : [];
      
      // Add new selection
      selections.push(data);
      
      // Save back to localStorage
      localStorage.setItem('battle_selections', JSON.stringify(selections));
      
      console.log("Successfully saved to localStorage");
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">Loading battles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <p className="text-red-500 text-center">{error}</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (battleItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <p className="text-center text-muted-foreground">No battle looks available at the moment.</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Please upload at least two images to create a battle.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-2 sm:px-4 mx-auto">
      <div className="grid gap-8 py-4">
        {battleItems.map((battle) => (
          <Card key={battle.id} className="overflow-hidden border rounded-lg">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={battle.avatar_url || ''} alt={battle.username || 'User'} />
                    <AvatarFallback>{(battle.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{battle.username || 'Anonymous'}</div>
                </div>
                <p className="mt-2 text-sm text-gray-500">{battle.caption || 'Which option do you prefer?'}</p>
              </div>
              
              {/* Responsive layout: Different for mobile vs tablet/desktop */}
              <div className="p-2">
                {/* Mobile layout (2x2 grid): options in first row, main image in second row */}
                <div className="sm:hidden grid grid-cols-2 gap-2">
                  {/* Option 1 */}
                  {battle.option1_url && (
                    <div 
                      className={`aspect-square relative cursor-pointer transition-all duration-200 
                        ${battle.selectedOption === 1 ? 'ring-4 ring-primary' : 'hover:opacity-90'}`}
                      onClick={() => handleSelection(battle.id, 1)}
                    >
                      {!imageErrors[`${battle.id}-option1`] ? (
                        <img
                          src={`${battle.option1_url}${imageTries[`${battle.id}-option1`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Option 1"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-option1`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Option 1
                      </div>
                    </div>
                  )}
                  
                  {/* Option 2 */}
                  {battle.option2_url && (
                    <div 
                      className={`aspect-square relative cursor-pointer transition-all duration-200 
                        ${battle.selectedOption === 2 ? 'ring-4 ring-primary' : 'hover:opacity-90'}`}
                      onClick={() => handleSelection(battle.id, 2)}
                    >
                      {!imageErrors[`${battle.id}-option2`] ? (
                        <img
                          src={`${battle.option2_url}${imageTries[`${battle.id}-option2`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Option 2"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-option2`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Option 2
                      </div>
                    </div>
                  )}
                  
                  {/* Main Image */}
                  {battle.image_url && (
                    <div className="col-span-2 aspect-square relative mt-2">
                      {!imageErrors[`${battle.id}-main`] ? (
                        <img
                          src={`${battle.image_url}${imageTries[`${battle.id}-main`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Main Look"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-main`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Main Look
                      </div>
                    </div>
                  )}
                  
                  {/* Updated instruction text for mobile */}
                  <div className="col-span-2 text-center mt-2 px-2">
                    <p className="text-sm text-muted-foreground select-none">
                      Which of the options is more suitable?<br />
                      Click and select the option you prefer.
                    </p>
                    
                    {/* Add Select button that appears when an option is selected */}
                    {battle.selectedOption && (
                      <Button 
                        className="mt-3 w-full"
                        onClick={() => handleConfirmSelection(battle.id)}
                        type="button"
                        disabled={battle.isSaved || savingItems[battle.id]}
                      >
                        {savingItems[battle.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : battle.isSaved ? (
                          "Selection Saved!"
                        ) : (
                          `Select Option ${battle.selectedOption}`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Tablet/Desktop layout (3 columns in a row like the reference image) */}
                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2">
                  {/* Option 1 */}
                  {battle.option1_url && (
                    <div 
                      className={`aspect-square relative cursor-pointer transition-all duration-200 
                        ${battle.selectedOption === 1 ? 'ring-4 ring-primary' : 'hover:opacity-90'}`}
                      onClick={() => handleSelection(battle.id, 1)}
                    >
                      {!imageErrors[`${battle.id}-option1`] ? (
                        <img
                          src={`${battle.option1_url}${imageTries[`${battle.id}-option1`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Option 1"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-option1`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Option 1
                      </div>
                    </div>
                  )}
                  
                  {/* Main Image */}
                  {battle.image_url && (
                    <div className="aspect-square relative">
                      {!imageErrors[`${battle.id}-main`] ? (
                        <img
                          src={`${battle.image_url}${imageTries[`${battle.id}-main`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Main Look"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-main`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Main Look
                      </div>
                    </div>
                  )}
                  
                  {/* Option 2 */}
                  {battle.option2_url && (
                    <div 
                      className={`aspect-square relative cursor-pointer transition-all duration-200 
                        ${battle.selectedOption === 2 ? 'ring-4 ring-primary' : 'hover:opacity-90'}`}
                      onClick={() => handleSelection(battle.id, 2)}
                    >
                      {!imageErrors[`${battle.id}-option2`] ? (
                        <img
                          src={`${battle.option2_url}${imageTries[`${battle.id}-option2`] ? `?retry=${Date.now()}` : ''}`}
                          alt="Option 2"
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`${battle.id}-option2`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">
                        Option 2
                      </div>
                    </div>
                  )}
                  
                  {/* Updated instruction text for desktop/tablet */}
                  <div className="col-span-3 text-center mt-3">
                    <p className="text-sm text-muted-foreground select-none">
                      Which of the options is more suitable?<br />
                      Click and select the option you prefer.
                    </p>
                    
                    {/* Add Select button that appears when an option is selected */}
                    {battle.selectedOption && (
                      <Button 
                        className="mt-3"
                        onClick={() => handleConfirmSelection(battle.id)}
                        type="button"
                        disabled={battle.isSaved || savingItems[battle.id]}
                      >
                        {savingItems[battle.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : battle.isSaved ? (
                          "Selection Saved!"
                        ) : (
                          `Select Option ${battle.selectedOption}`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}

export default function BattlePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BattlePageContent />
    </QueryClientProvider>
  );
}