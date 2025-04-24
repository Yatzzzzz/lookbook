'use client';

import React from 'react';

export default function LookPage() {
  const lookId = '123'; // Example look ID
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Look Details</h1>
      {/* Look page content would go here */}
      <div className="mt-6 flex space-x-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
          Share
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-md">
          Save
        </button>
        <button className="px-4 py-2 bg-yellow-600 text-white rounded-md">
          Wishlist
        </button>
        <a href={`/tryon/${lookId}`} className="px-4 py-2 bg-purple-600 text-white rounded-md">
          Virtual Try-On
        </a>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md">
          Buy
        </button>
      </div>
    </div>
  );
} 