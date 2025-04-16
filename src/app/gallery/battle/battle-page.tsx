import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Look } from "@shared/schema";
import { Loader2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

interface BattleState {
  winner?: number;
  aiSuggestion?: string;
}

export default function BattlePage() {
  const { toast } = useToast();
  const [battles, setBattles] = useState<Record<number, BattleState>>({});

  const { data: looks, isLoading } = useQuery<Look[]>({
    queryKey: ["/api/looks"],
  });

  const getAISuggestionMutation = useMutation({
    mutationFn: async (looks: Look[]) => {
      const response = await apiRequest("POST", "/api/clothes-gpt", {
        prompt: `Compare these outfits: ${looks.map(l => l.description).join(" vs ")}. Which one is more stylish and why?`
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const battleId = Math.floor(variables[0].id / 2);
      setBattles(prev => ({
        ...prev,
        [battleId]: {
          ...prev[battleId],
          aiSuggestion: data.outfit
        }
      }));
    }
  });

  const handleVote = async (battleId: number, winnerId: number) => {
    setBattles(prev => ({
      ...prev,
      [battleId]: {
        ...prev[battleId],
        winner: winnerId
      }
    }));

    toast({
      title: "Vote recorded!",
      description: "Thanks for participating in this fashion battle.",
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

  // Group looks into sets of 2 for battle
  const battleGroups = looks?.reduce<Look[][]>((acc, look, index) => {
    if (index % 2 === 0) {
      acc.push([look]);
    } else {
      acc[acc.length - 1].push(look);
    }
    return acc;
  }, []).filter(group => group.length === 2) || [];

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex items-center h-14">
          <div className="text-lg md:text-xl font-semibold">Style Battle</div>
        </div>
      </div>

      <main className="container px-4 py-6 md:py-8">
        <div className="space-y-4 md:space-y-8">
          {battleGroups.map((battle, battleId) => {
            const battleState = battles[battleId] || {};

            return (
              <Card key={battleId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    {battle.map((look, index) => (
                      <div key={look.id} className="relative">
                        <div className="relative">
                          <img
                            src={look.imageUrl}
                            alt={look.description || "Fashion look"}
                            className="w-full aspect-square object-cover rounded-md"
                          />
                          {battleState.winner === look.id && (
                            <div className="absolute top-2 right-2">
                              <Trophy className="h-6 w-6 text-yellow-500" />
                            </div>
                          )}
                        </div>

                        {!battleState.winner && (
                          <Button
                            className="mt-4 w-full"
                            onClick={() => handleVote(battleId, look.id)}
                          >
                            Vote for this look
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {!battleState.aiSuggestion && !battleState.winner && (
                    <Button 
                      className="mt-4"
                      variant="outline"
                      onClick={() => getAISuggestionMutation.mutate(battle)}
                      disabled={getAISuggestionMutation.isPending}
                    >
                      {getAISuggestionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Getting AI suggestion...
                        </>
                      ) : (
                        "Get AI suggestion"
                      )}
                    </Button>
                  )}

                  {battleState.aiSuggestion && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {battleState.aiSuggestion}
                      </p>
                    </div>
                  )}
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