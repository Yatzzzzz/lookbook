'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { Search as SearchIcon, Loader2, User as UserIcon, Tag as TagIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchResults, SearchCategory, ContextualSearchResults, SearchResultItem } from '@/types/search';

// Force dynamic rendering to prevent static prerendering issues with Supabase
export const dynamic = 'force-dynamic';

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = (searchParams.get('category') as SearchCategory) || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isAISearch, setIsAISearch] = useState(initialCategory === 'ai-search');
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    looks: [],
    tags: [],
    styles: [],
    brands: [],
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // For AI search
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // For pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Use debounce to avoid too many search requests
  const debouncedQuery = useDebounce(searchQuery, 500);

  const tabs = [
    { id: 'all', name: 'All Results' },
    { id: 'users', name: 'Users' },
    { id: 'looks', name: 'Looks' },
    { id: 'tags', name: 'Tags' },
    { id: 'styles', name: 'Styles' },
    { id: 'brands', name: 'Brands' },
    { id: 'ai-search', name: 'AI Search' },
  ];

  // Effect to fetch search results when query changes
  useEffect(() => {
    if (debouncedQuery) {
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      if (isAISearch) {
        params.set('mode', 'ai');
      }
      router.push(`/search?${params.toString()}`);
      
      if (!isAISearch) {
        fetchSearchResults();
      }
    }
  }, [debouncedQuery, isAISearch]);

  // Fetch search results
  const fetchSearchResults = async () => {
    if (!debouncedQuery.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Searching for:', debouncedQuery);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError(data.error || 'Failed to retrieve search results');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regular search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // If on AI search tab, switch to all results
    if (isAISearch) {
      setIsAISearch(false);
    }
  };

  // Handle AI search
  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiError('');
    
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `Help me find fashion items related to: ${aiQuery}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI search failed');
      }
      
      const data = await response.json();
      
      if (data.result) {
        setAiResults(data.result);
      } else {
        setAiError(data.error || 'AI search failed');
      }
    } catch (error) {
      console.error('AI search error:', error);
      setAiError('AI search failed to process your request');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Component to display search results
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 my-8">
          <p>{error}</p>
        </div>
      );
    }

    if (!debouncedQuery.trim()) {
      return (
        <div className="text-center text-gray-500 my-8">
          <p>Enter a search term to find looks, users, styles, and more.</p>
        </div>
      );
    }

    // Check if we have the new contextual results structure
    if ('results' in searchResults) {
      return renderContextualResults();
    }

    // If no results in any category
    if (searchResults.total === 0) {
      return (
        <div className="text-center text-gray-500 my-8">
          <p>No results found for "{debouncedQuery}"</p>
        </div>
      );
    }

    // Different displays based on active tab
    return (
      <div className="space-y-6">
        {/* Users Section */}
        {(isAISearch || isAISearch === false) && searchResults.users.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Users {isAISearch === false && `(${searchResults.users.length})`}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {searchResults.users.slice(0, isAISearch === false ? 4 : undefined).map(user => (
                <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition">
                  {user.avatar_url ? (
                    <Image 
                      src={user.avatar_url} 
                      alt={user.username} 
                      width={64} 
                      height={64} 
                      className="rounded-full w-16 h-16 object-cover mb-2"
                    />
                  ) : (
                    <div className="rounded-full w-16 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                      <UserIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium">@{user.username}</span>
                </Link>
              ))}
            </div>
            {isAISearch === false && searchResults.users.length > 4 && (
              <button 
                onClick={() => setIsAISearch(false)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                View all {searchResults.users.length} users
              </button>
            )}
          </div>
        )}
        
        {/* Looks Section */}
        {(isAISearch || isAISearch === false) && searchResults.looks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Looks {isAISearch === false && `(${searchResults.looks.length})`}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {searchResults.looks.slice(0, isAISearch === false ? 6 : undefined).map(look => (
                <Link href={`/look/${look.look_id}`} key={look.look_id} className="block">
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                    <Image 
                      src={look.image_url} 
                      alt={look.title || 'Fashion look'} 
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium truncate">{look.title || 'Fashion look'}</h3>
                    {look.username && <p className="text-xs text-gray-500">@{look.username}</p>}
                  </div>
                </Link>
              ))}
            </div>
            {isAISearch === false && searchResults.looks.length > 6 && (
              <button 
                onClick={() => setIsAISearch(false)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                View all {searchResults.looks.length} looks
              </button>
            )}
          </div>
        )}
        
        {/* Tags Section */}
        {(isAISearch || isAISearch === false) && searchResults.tags.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Tags {isAISearch === false && `(${searchResults.tags.length})`}</h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.tags.slice(0, isAISearch === false ? 10 : undefined).map((tag, index) => (
                <Link 
                  href={`/search?q=${tag.name}&category=looks`} 
                  key={tag.id || index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
            {isAISearch === false && searchResults.tags.length > 10 && (
              <button 
                onClick={() => setIsAISearch(false)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                View all {searchResults.tags.length} tags
              </button>
            )}
          </div>
        )}
        
        {/* Styles Section */}
        {(isAISearch || isAISearch === false) && searchResults.styles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Styles {isAISearch === false && `(${searchResults.styles.length})`}</h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.styles.slice(0, isAISearch === false ? 10 : undefined).map((style, index) => (
                <Link 
                  href={`/search?q=${style.name}&category=looks`} 
                  key={style.id || index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
                >
                  {style.name}
                </Link>
              ))}
            </div>
            {isAISearch === false && searchResults.styles.length > 10 && (
              <button 
                onClick={() => setIsAISearch(false)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                View all {searchResults.styles.length} styles
              </button>
            )}
          </div>
        )}
        
        {/* Brands Section */}
        {(isAISearch || isAISearch === false) && searchResults.brands.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Brands {isAISearch === false && `(${searchResults.brands.length})`}</h2>
            <div className="flex flex-wrap gap-2">
              {searchResults.brands.slice(0, isAISearch === false ? 10 : undefined).map((brand, index) => (
                <Link 
                  href={`/search?q=${brand.name}&category=looks`} 
                  key={brand.id || index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
            {isAISearch === false && searchResults.brands.length > 10 && (
              <button 
                onClick={() => setIsAISearch(false)} 
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                View all {searchResults.brands.length} brands
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // New function to render contextual search results
  const renderContextualResults = () => {
    console.log('Rendering contextual results:', searchResults);
    if (!('results' in searchResults) || searchResults.results.length === 0) {
      return (
        <div className="text-center text-gray-500 my-8">
          <p>No results found for "{debouncedQuery}"</p>
        </div>
      );
    }

    // Group results by context for better organization
    const groupedResults: Record<string, any[]> = {};
    searchResults.results.forEach(result => {
      if (!groupedResults[result.context]) {
        groupedResults[result.context] = [];
      }
      groupedResults[result.context].push(result);
    });
    
    console.log('Grouped results:', groupedResults);
    
    return (
      <div className="space-y-8">
        {Object.entries(groupedResults).map(([context, items]) => (
          <section key={context} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold mb-3">{context}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <Link href={item.url} key={item.id}>
                  <div className="relative group">
                    {/* Show image if available */}
                    {item.image_url ? (
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image 
                          src={item.image_url} 
                          alt={item.primary_text} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {item.type === 'user' && <UserIcon size={24} />}
                        {item.type === 'style' && <TagIcon className="h-6 w-6" />}
                        {(item.type !== 'user' && item.type !== 'style') && 
                          <span className="text-2xl font-light">{item.primary_text.charAt(0)}</span>
                        }
                      </div>
                    )}
                    
                    {/* Item information */}
                    <div className="mt-2">
                      <h3 className="text-sm font-medium truncate">{item.primary_text}</h3>
                      {item.secondary_text && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.secondary_text}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  // Render AI search
  const renderAiSearch = () => (
    <div>
      <form onSubmit={handleAiSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about fashion styles, outfit ideas, or style advice..."
            className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
          <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <button 
            type="submit" 
            className="absolute right-3 top-2.5 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAiLoading}
          >
            {isAiLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </form>

      {isAiLoading && (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {aiError && (
        <div className="text-center text-red-500 my-8">
          <p>{aiError}</p>
        </div>
      )}

      {aiResults && !isAiLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-semibold mb-4">AI Response</h2>
          <div className="prose dark:prose-invert max-w-none">
            {aiResults}
          </div>
        </div>
      )}

      {!aiQuery.trim() && !aiResults && !isAiLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-blue-100 dark:border-blue-900">
          <h2 className="text-lg font-semibold mb-2">Ask AI for Fashion Advice</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Try asking questions like:</p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• "What should I wear to a summer wedding?"</li>
            <li>• "How can I style a leather jacket?"</li>
            <li>• "What are the trending colors this season?"</li>
            <li>• "Help me put together an outfit for a job interview"</li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      
      {/* Search input */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for looks, users, styles..."
              className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
            <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </form>
      </div>
      
      {/* Toggle between normal and AI search */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setIsAISearch(false)}
          className={`px-4 py-2 rounded-l-lg ${!isAISearch 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          Regular Search
        </button>
        <button
          onClick={() => setIsAISearch(true)}
          className={`px-4 py-2 rounded-r-lg ${isAISearch 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          AI-Powered Search
        </button>
      </div>
      
      {/* Search results */}
      <div className="mt-6">
        {isAISearch ? renderAiSearch() : renderSearchResults()}
      </div>
      
      <BottomNav />
    </div>
  );
} 