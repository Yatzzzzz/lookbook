'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import NavBar from "@/components/NavBar";
import { Textarea } from "@/components/ui/textarea";

// Define types
interface Look {
  id: number;
  imageUrl: string;
  description?: string;
}

// Mock data for testing until API is integrated
const mockLooks: Look[] = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920",
    description: "Summer casual outfit with white shirt and jeans"
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?q=80&w=1920",
    description: "Formal business attire with navy blazer"
  }
];

// Suggested occasions for users to choose from
const SUGGESTED_OCCASIONS = [
  "Work meeting",
  "First date",
  "Job interview",
  "Casual Friday",
  "Wedding",
  "Dinner party",
  "Meeting the parents",
  "Night out",
  "Beach day",
  "Formal event"
];

export default function YayNayPage() {
  const [currentLookIndex, setCurrentLookIndex] = useState(0);
  const [customOccasion, setCustomOccasion] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [vote, setVote] = useState<'yay' | 'nay' | null>(null);
  
  const handleOccasionSelect = (occasion: string) => {
    setSelectedOccasion(occasion);
    setCustomOccasion(occasion);
  };
  
  const handleVote = (result: 'yay' | 'nay') => {
    setVote(result);
  };
  
  const handleNext = () => {
    // In a real app, would save feedback to backend here
    // Then move to next look if available
    if (currentLookIndex < mockLooks.length - 1) {
      setCurrentLookIndex(currentLookIndex + 1);
      setCustomOccasion('');
      setSelectedOccasion('');
      setVote(null);
    } else {
      // End of items, could redirect to a thank you page or back to main gallery
      alert("You've reviewed all items!");
    }
  };

  const currentLook = mockLooks[currentLookIndex];

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center h-14">
          <div className="text-lg md:text-xl font-semibold">Yay or Nay</div>
        </div>
      </div>

      <main className="container px-4 py-6 md:py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="rounded-full">
            <a href="/gallery" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </a>
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left side - Image */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={currentLook.imageUrl}
                alt={currentLook.description || "Fashion look"}
                className="w-full h-full object-cover"
              />
            </CardContent>
          </Card>
          
          {/* Right side - Occasion and voting */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-2">Can I wear this to...</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Specify the occasion for others to give better feedback
                  </p>
                  
                  <Textarea
                    placeholder="What occasion are you dressing for?"
                    className="resize-none mb-4"
                    value={customOccasion}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomOccasion(e.target.value)}
                  />
                  
                  <div className="mb-6">
                    <div className="text-sm font-medium mb-2">Suggestions:</div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_OCCASIONS.map((occasion, index) => (
                        <Button
                          key={index}
                          variant={selectedOccasion === occasion ? "default" : "outline"}
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={() => handleOccasionSelect(occasion)}
                        >
                          {occasion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {customOccasion && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="font-medium mb-2">Preview:</div>
                    <div>
                      Can I wear this to {customOccasion}?
                      
                      {vote && (
                        <span className="ml-2">
                          {vote === 'yay' ? (
                            <span className="inline-flex items-center text-green-500">
                              <ThumbsUp className="h-4 w-4 mr-1" /> Yay
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-500">
                              <ThumbsDown className="h-4 w-4 mr-1" /> Nay
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {customOccasion && !vote && (
                  <div className="flex justify-end gap-4">
                    <Button 
                      onClick={() => handleVote('yay')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" /> Yay
                    </Button>
                    <Button 
                      onClick={() => handleVote('nay')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" /> Nay
                    </Button>
                  </div>
                )}
                
                {vote && (
                  <Button 
                    onClick={handleNext}
                    className="w-full"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}