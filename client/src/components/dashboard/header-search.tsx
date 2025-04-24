import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandDialog } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from '@/hooks/use-debounce';
import { createLogger } from '@/lib/logger';
import {
  Search,
  Package,
  ReceiptText,
  User,
  Calendar,
  Clock,
  X,
  AlertTriangle,
  CheckCircle2,
  Keyboard
} from 'lucide-react';

const logger = createLogger('HeaderSearch');

// Search result types with better typing
interface SearchResult {
  id: string | number;
  type: 'item' | 'report' | 'user' | 'notification' | 'payment';
  title: string;
  description: string;
  category?: string;
  status?: string;
  date?: string;
  imageUrl?: string;
  url: string;
}

// Recent searches saved by the user
interface RecentSearch {
  query: string;
  timestamp: Date;
}

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [, navigate] = useLocation();
  
  // Debounce the search query to prevent excessive API calls
  const debouncedQuery = useDebounce(query, 300);
  
  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches);
        setRecentSearches(
          parsedSearches.map((search: any) => ({
            ...search,
            timestamp: new Date(search.timestamp)
          }))
        );
      } catch (error) {
        logger.error('Failed to parse recent searches', error);
      }
    }
  }, []);
  
  // Listen for keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  
  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // In a production environment, this would be an API call
        // const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        // const data = await response.json();
        
        // Simulate API delay for testing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Example results - in production these would come from the API
        const demoResults: SearchResult[] = [
          {
            id: '1',
            type: 'item',
            title: 'Macbook Pro 16"',
            description: 'Registered on Jun 15, 2025',
            category: 'Electronics',
            status: 'registered',
            date: '2025-06-15',
            url: '/items/1'
          },
          {
            id: '2',
            type: 'report',
            title: 'Lost Wallet Report',
            description: 'Black leather wallet, ID Cards inside',
            status: 'active',
            date: '2025-06-20',
            url: '/reports/2'
          },
          {
            id: '3',
            type: 'payment',
            title: 'Registration Payment',
            description: '5,000 RWF - Successful',
            status: 'successful',
            date: '2025-06-15',
            url: '/payments/3'
          }
        ];
        
        setResults(demoResults);
      } catch (error) {
        logger.error('Search failed', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery]);
  
  // Save a search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newSearch = { query: searchQuery, timestamp: new Date() };
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.query !== searchQuery).slice(0, 4)
    ];
    
    setRecentSearches(updatedSearches);
    
    // Save to localStorage
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      logger.error('Failed to save recent searches', error);
    }
  };
  
  // Handle clicking a search result
  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setOpen(false);
    navigate(result.url);
  };
  
  // Handle clicking a recent search
  const handleRecentSearchSelect = (searchQuery: string) => {
    setQuery(searchQuery);
  };
  
  // Remove a recent search
  const removeRecentSearch = (e: React.MouseEvent, searchQuery: string) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter(s => s.query !== searchQuery);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };
  
  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'item':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'report':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'user':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'payment':
        return <ReceiptText className="h-4 w-4 text-green-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format relative time for recent searches
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    }
    
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };
  
  // Get status badge style
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    let className = '';
    
    switch (status.toLowerCase()) {
      case 'registered':
        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        break;
      case 'active':
        className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        break;
      case 'successful':
        className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        break;
      default:
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
    
    return (
      <Badge variant="outline" className={`${className} text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-72 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="hidden lg:inline-flex">Search for items, reports...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.35rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Search for items, reports, users..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            value={query}
            onValueChange={setQuery}
          />
          {query && (
            <Button 
              variant="ghost" 
              onClick={() => setQuery('')}
              className="h-6 w-6 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CommandList>
          {isLoading ? (
            <div className="px-3 py-4 space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <>
              {results.length > 0 ? (
                <CommandGroup heading="Results">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultSelect(result)}
                      className="px-4 py-2"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            {getResultIcon(result.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-medium">{result.title}</p>
                            <div className="ml-2">
                              {getStatusBadge(result.status)}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {result.description}
                          </p>
                          {result.date && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(result.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6">
                    <Search className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">No results found</p>
                    <p className="text-xs text-muted-foreground">Try a different search term</p>
                  </div>
                </CommandEmpty>
              )}
            </>
          ) : (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search) => (
                    <CommandItem
                      key={search.query}
                      onSelect={() => handleRecentSearchSelect(search.query)}
                      className="px-4 py-2 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{search.query}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          {formatRelativeTime(search.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => removeRecentSearch(e, search.query)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              <CommandGroup heading="Tips">
                <div className="px-4 py-2">
                  <div className="flex items-start space-x-2 mb-2">
                    <Keyboard className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Use keyboard to navigate</p>
                      <p className="text-xs text-muted-foreground">
                        Press ↑↓ to navigate, Enter to select, Esc to close
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2">
                    <p className="mb-1"><span className="font-medium">Try searching for:</span></p>
                    <ul className="space-y-1 pl-2">
                      <li>• Items by name, serial number, or category</li>
                      <li>• Reports by status (active, resolved)</li>
                      <li>• Payments by date or amount</li>
                    </ul>
                  </div>
                </div>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}