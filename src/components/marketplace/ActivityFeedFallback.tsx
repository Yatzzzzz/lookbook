'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityFeedFallback() {
  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Activity Feed</CardTitle>
        <CardDescription>Recent activity from users you follow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-2 text-center text-muted-foreground">
          <p>Unable to load activity feed</p>
          <p className="text-sm mt-1">
            Activity data will be available soon. Try refreshing the page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 