import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Look } from "@shared/schema";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/layout/bottom-nav";

interface Comment {
  id: number;
  text: string;
  username: string;
}

export default function CrowdPage() {
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState("");

  const { data: looks, isLoading } = useQuery<Look[]>({
    queryKey: ["/api/looks"],
  });

  const handleComment = (lookId: number) => {
    if (!newComment.trim()) return;

    setComments((prev) => ({
      ...prev,
      [lookId]: [
        ...(prev[lookId] || []),
        {
          id: Date.now(),
          text: newComment,
          username: "You",
        },
      ],
    }));
    setNewComment("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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

      <main className="container py-4 md:py-8">
        <div className="space-y-4 md:space-y-8">
          {looks?.map((look) => (
            <Card key={look.id}>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <img
                      src={look.imageUrl}
                      alt={look.description || "Fashion look"}
                      className="w-full h-[300px] md:h-[400px] object-cover rounded-md"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg md:text-xl font-semibold">
                        {look.description || "Ask the crowd"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Get suggestions and feedback from the community
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar">
                      {comments[look.id]?.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-muted p-3 rounded-lg space-y-1"
                        >
                          <div className="font-medium text-sm">
                            {comment.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {comment.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask a question or give feedback..."
                        className="flex-1 min-h-[80px] md:min-h-[100px]"
                      />
                      <Button
                        onClick={() => handleComment(look.id)}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}