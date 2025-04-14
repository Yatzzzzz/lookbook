import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Look } from "@shared/schema";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/layout/bottom-nav";

interface VoteResult {
  lookId: number;
  result: "yay" | "nay";
  aiOpinion?: string;
}

export default function YayNayPage() {
  const { toast } = useToast();
  const [votes, setVotes] = useState<VoteResult[]>([]);

  const { data: looks, isLoading } = useQuery<Look[]>({
    queryKey: ["/api/looks"],
  });

  const getAIOpinionMutation = useMutation({
    mutationFn: async (look: Look) => {
      const response = await apiRequest("POST", "/api/clothes-gpt", {
        prompt: `Analyze this outfit description and provide a quick opinion about its style: ${look.description}`
      });
      return response.json();
    },
    onSuccess: (data, look) => {
      setVotes(prev => 
        prev.map(v => 
          v.lookId === look.id 
            ? { ...v, aiOpinion: data.outfit }
            : v
        )
      );
    }
  });

  const handleVote = async (lookId: number, vote: "yay" | "nay") => {
    const look = looks?.find(l => l.id === lookId);
    setVotes(prev => [...prev, { lookId, result: vote }]);

    if (look) {
      getAIOpinionMutation.mutate(look);
    }

    toast({
      title: vote === "yay" ? "Yay! 🎉" : "Nay! 👎",
      description: "Your vote has been recorded.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Navigation />
        <div className="flex justify-center items-center min-h-[300px] md:min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center h-14">
          <div className="text-lg md:text-xl font-semibold">Yay or Nay</div>
        </div>
      </div>

      <main className="container px-4 py-6 md:py-8">
        <div className="space-y-4 md:space-y-8">
          {looks?.map((look) => {
            const vote = votes.find((v) => v.lookId === look.id);

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
                          ) : (
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
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