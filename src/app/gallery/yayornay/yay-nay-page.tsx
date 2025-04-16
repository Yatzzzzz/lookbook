'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import NavBar from "@/components/NavBar";

// Define types
interface Look {
  id: number;
  imageUrl: string;
  description?: string;
}

interface VoteResult {
  lookId: number;
  result: "yay" | "nay";
  aiOpinion?: string;
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

export default function YayNayPage() {
  const [votes, setVotes] = useState<VoteResult[]>([]);
  const [isLoadingOpinions, setIsLoadingOpinions] = useState<Record<number, boolean>>({});

  // Mock API response function
  const getAIOpinion = async (description: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock AI opinion
    return {
      outfit: `This ${description} looks ${Math.random() > 0.5 ? 'great for the occasion!' : 'stylish but could use some accessories.'}`,
    };
  };

  const handleVote = async (lookId: number, vote: "yay" | "nay") => {
    const look = mockLooks.find(l => l.id === lookId);
    setVotes(prev => [...prev, { lookId, result: vote }]);

    if (look?.description) {
      setIsLoadingOpinions(prev => ({ ...prev, [lookId]: true }));
      try {
        const aiResponse = await getAIOpinion(look.description);
        setVotes(prev => 
          prev.map(v => 
            v.lookId === lookId 
              ? { ...v, aiOpinion: aiResponse.outfit }
              : v
          )
        );
      } catch (error) {
        console.error("Error getting AI opinion:", error);
      } finally {
        setIsLoadingOpinions(prev => ({ ...prev, [lookId]: false }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <NavBar />

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center h-14">
          <div className="text-lg md:text-xl font-semibold">Yay or Nay</div>
        </div>
      </div>

      <main className="container px-4 py-6 md:py-8">
        <div className="space-y-4 md:space-y-8">
          {mockLooks.map((look) => {
            const vote = votes.find((v) => v.lookId === look.id);
            const isLoading = isLoadingOpinions[look.id];

            return (
              <Card key={look.id}>
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-3 gap-4 md:gap-8">
                    <div className="relative">
                      <img
                        src={look.imageUrl}
                        alt={look.description || "Fashion look"}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    </div>

                    <div className="flex items-center">
                      <div className="text-center w-full space-y-4">
                        <h3 className="text-lg md:text-xl font-semibold">
                          {look.description || "Rate this look"}
                        </h3>
                        {!vote && (
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={() => handleVote(look.id, "yay")}
                              variant="outline"
                              className="w-20 md:w-24"
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Yay
                            </Button>
                            <Button
                              onClick={() => handleVote(look.id, "nay")}
                              variant="outline"
                              className="w-20 md:w-24"
                            >
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Nay
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {vote && (
                      <div className="flex items-center">
                        <div className="text-center w-full">
                          <h4 className="text-base md:text-lg font-medium mb-4">AI Opinion</h4>
                          {vote.aiOpinion ? (
                            <p className="text-sm text-muted-foreground">
                              {vote.aiOpinion}
                            </p>
                          ) : isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          ) : (
                            <p className="text-sm text-muted-foreground">Waiting for AI opinion...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}