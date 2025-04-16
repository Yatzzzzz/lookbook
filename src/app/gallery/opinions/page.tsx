'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function OpinionsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Fashion Opinions</h2>
          <p className="text-gray-600 mb-4">
            Coming soon! This feature will allow you to share your opinions on the latest fashion trends and see what others think.
          </p>
          <div className="mt-8 space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <h3 className="font-medium">User Feedback</h3>
                  <p className="text-sm text-gray-500">Opinion placeholder</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <h3 className="font-medium">Expert Commentary</h3>
                  <p className="text-sm text-gray-500">Opinion placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 