'use client';

import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Plus, Check } from 'lucide-react';

export type AudienceType = 'everyone' | 'followers' | 'friends' | 'individuals';

interface Person {
  id: string;
  name: string;
  avatar: string;
}

interface AudienceSelectorProps {
  onComplete: (audience: AudienceType, excludedPeople: Person[]) => void;
  onBack?: () => void;
  initialAudience?: AudienceType;
  initialExcludedPeople?: Person[];
  loading?: boolean;
}

export default function AudienceSelector({ 
  onComplete, 
  onBack, 
  initialAudience = 'everyone', 
  initialExcludedPeople = [], 
  loading = false 
}: AudienceSelectorProps) {
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>(initialAudience);
  const [excludedPeople, setExcludedPeople] = useState<Person[]>(initialExcludedPeople);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for people suggestions
  const mockPeople: Person[] = [
    { id: '1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex' },
    { id: '2', name: 'Jamie Smith', avatar: 'https://i.pravatar.cc/150?u=jamie' },
    { id: '3', name: 'Casey Williams', avatar: 'https://i.pravatar.cc/150?u=casey' },
    { id: '4', name: 'Taylor Brown', avatar: 'https://i.pravatar.cc/150?u=taylor' },
    { id: '5', name: 'Jordan Davis', avatar: 'https://i.pravatar.cc/150?u=jordan' },
  ];

  // Filter people based on search query
  const filteredPeople = mockPeople.filter(
    (person) => 
      !excludedPeople.some(excludedPerson => excludedPerson.id === person.id) &&
      person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExcludedPerson = (person: Person) => {
    setExcludedPeople([...excludedPeople, person]);
    setSearchQuery('');
  };

  const removeExcludedPerson = (personId: string) => {
    setExcludedPeople(excludedPeople.filter(person => person.id !== personId));
  };

  const handleComplete = () => {
    onComplete(selectedAudience, excludedPeople);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-center">Who can see this look?</h2>
      
      <Tabs.Root
        value={selectedAudience}
        onValueChange={(value) => setSelectedAudience(value as AudienceType)}
        className="mb-6"
      >
        <Tabs.List className="flex space-x-1 rounded-md bg-gray-100 dark:bg-gray-800 p-1 mb-4">
          <Tabs.Trigger
            value="everyone"
            className="flex-1 py-2 rounded-md transition-colors text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
          >
            Everyone
          </Tabs.Trigger>
          <Tabs.Trigger
            value="followers"
            className="flex-1 py-2 rounded-md transition-colors text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
          >
            Followers
          </Tabs.Trigger>
          <Tabs.Trigger
            value="friends"
            className="flex-1 py-2 rounded-md transition-colors text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
          >
            Friends
          </Tabs.Trigger>
          <Tabs.Trigger
            value="individuals"
            className="flex-1 py-2 rounded-md transition-colors text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
          >
            Select
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="everyone" className="text-center text-gray-600 dark:text-gray-400">
          This look will be visible to everyone on the platform.
        </Tabs.Content>
        
        <Tabs.Content value="followers" className="text-center text-gray-600 dark:text-gray-400">
          Only your followers will be able to see this look.
        </Tabs.Content>
        
        <Tabs.Content value="friends" className="text-center text-gray-600 dark:text-gray-400">
          Only your friends will be able to see this look.
        </Tabs.Content>
        
        <Tabs.Content value="individuals" className="text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">Manually select who can see this look.</p>
          <div className="text-sm italic">Coming soon</div>
        </Tabs.Content>
      </Tabs.Root>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Hide from specific people:</h3>
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          
          {searchQuery && filteredPeople.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-700 max-h-60 overflow-auto">
              {filteredPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => addExcludedPerson(person)}
                >
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>{person.name}</span>
                  <Plus className="ml-auto w-4 h-4" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {excludedPeople.length > 0 && (
          <div className="mb-4">
            <div className="text-sm mb-2">Hidden from:</div>
            <div className="flex flex-wrap gap-2">
              {excludedPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm"
                >
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{person.name}</span>
                  <button
                    onClick={() => removeExcludedPerson(person.id)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 mt-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-md text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleComplete}
          className="flex-1 px-4 py-2 bg-blue-500 rounded-md text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
} 