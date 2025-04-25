import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from '../../hooks/use-debounce';
import { createLogger } from '@/lib/logger';
import {
  Search,
  LayoutGrid,
  ListFilter,
  Clock,
  ArrowUpRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  X,
  User,
  SlidersHorizontal,
  AlertCircle,
  Smartphone,
  FileText,
  ScanLine
} from 'lucide-react';

// Logger for tracking search activity
const logger = createLogger('GlobalSearch');

// Search result types
interface SearchResult {
  id: string;
  type: 'item' | 'report' | 'user' | 'notification';
  title: string;
  description: string;
  category?: string;
  status?: string;
  date?: string;
  imageUrl?: string;
  url: string;
  uniqueId?: string; // IMEI, official document ID, or other unique ID
}

interface RecentSearch {
  query: string;
  timestamp: Date;
}

interface GlobalSearchProps {
  placeholder?: string;
  variant?: 'default' | 'compact' | 'inline' | 'navbar';
  onSearch?: (query: string) => void;
}

/**
 * Global Search Component
 * 
 * A powerful search interface with suggestions, filters, and recent searches.
 * This component provides both a trigger button and a command palette.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search by unique ID (IMEI, Document ID, etc.)",
  variant = 'default',
  onSearch
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);
  
  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches);
        // Convert string dates back to Date objects
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
  
  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      
      // Call the onSearch callback if provided
      if (onSearch && debouncedQuery.length >= 2) {
        onSearch(debouncedQuery);
      }
      
      setIsLoading(true);
      
      try {
        // Simulate API call with delayed response
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In real implementation, this would be an API call
        // const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        // const data = await response.json();
        
        // Determine if the query looks like a unique identifier
        // Determine if the query looks like various types of unique identifiers
        // Check for IMEI format (15-17 digits)
        const isImeiFormat = /^\d{15,17}$/.test(debouncedQuery);
        
        // Check for document ID formats (alphanumeric with possible separators)
        const isDocIdFormat = /^[A-Za-z0-9\-\/]{6,}$/.test(debouncedQuery);
        
        // Check for UUID format
        const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(debouncedQuery);
        
        // Check for serial number format (often starts with SN, S/N or similar)
        const isSerialNumFormat = /^(SN[-:]?|S\/N:?)?[A-Z0-9\-]{5,}$/i.test(debouncedQuery);
        
        // Combined unique ID check
        const isUniqueIdQuery = isImeiFormat || isDocIdFormat || isUuidFormat || isSerialNumFormat || /^[A-Za-z0-9\-]{6,}$/.test(debouncedQuery);
        
        // For now, generate demo results based on the query
        // In a real implementation, we would search specifically in uniqueId fields
        const demoResults: SearchResult[] = [
          {
            id: '1',
            type: 'item',
            title: 'Dell XPS 13 Laptop',
            description: 'Silver, registered on 2023-10-15',
            category: 'Electronics',
            status: 'registered',
            date: '2023-10-15',
            url: '/items/1',
            uniqueId: '358735-92ADKX-4672B'
          },
          {
            id: '2',
            type: 'item',
            title: 'National ID Card',
            description: 'Government issued ID, registered on 2023-12-22',
            category: 'Documents',
            status: 'registered',
            date: '2023-12-22',
            url: '/items/2',
            uniqueId: '119874356782'
          },
          {
            id: '3',
            type: 'item',
            title: 'iPhone 14 Pro',
            description: 'Black, 128GB, registered on 2023-09-20',
            category: 'Electronics',
            status: 'registered',
            date: '2023-09-20',
            url: '/items/3',
            uniqueId: '352022-11937845-01'
          },
          {
            id: '4',
            type: 'item',
            title: 'Samsung Smart TV',
            description: '55-inch 4K TV, registered on 2023-11-05',
            category: 'Electronics',
            status: 'registered',
            date: '2023-11-05',
            url: '/items/4',
            uniqueId: 'SN-XC7992-83A'
          }
        ];
        
        // First filter by unique ID if it appears to be a unique ID search
        let filteredResults = demoResults;
        if (isUniqueIdQuery) {
          // In a real implementation, we would check if the search exactly or partially matches uniqueId fields
          filteredResults = demoResults.filter(result => 
            result.uniqueId && result.uniqueId.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
        }
        
        // Then apply type filters if active
        if (activeFilter) {
          filteredResults = filteredResults.filter(result => {
            if (activeFilter === 'items') return result.type === 'item';
            if (activeFilter === 'reports') return result.type === 'report';
            if (activeFilter === 'users') return result.type === 'user';
            return true;
          });
        }
        
        setResults(filteredResults);
      } catch (error) {
        logger.error('Search failed', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery, activeFilter, onSearch]);
  
  // Handle keyboard shortcuts for opening search
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
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    // Call the onSearch callback if provided
    if (onSearch) {
      onSearch(query);
    }
    navigate(result.url);
    setOpen(false);
  };
  
  // Handle clicking a recent search
  const handleRecentSearchClick = (search: RecentSearch) => {
    setQuery(search.query);
    // Focus the input to trigger search
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Remove a recent search
  const removeRecentSearch = (e: React.MouseEvent, searchQuery: string) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter(s => s.query !== searchQuery);
    setRecentSearches(updatedSearches);
    
    // Update localStorage
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      logger.error('Failed to update recent searches', error);
    }
  };
  
  // Toggle a filter
  const toggleFilter = (filter: string) => {
    setActiveFilter(currentFilter => currentFilter === filter ? null : filter);
  };
  
  // Render icon based on result type
  const renderResultIcon = (type: string) => {
    switch (type) {
      case 'item':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'report':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'user':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Render the status badge for a result
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    let className = '';
    let icon = null;
    
    switch (status.toLowerCase()) {
      case 'registered':
        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        icon = <Package className="h-3 w-3 mr-1" />;
        break;
      case 'active':
        className = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
      case 'resolved':
        className = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      default:
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
    
    return (
      <Badge variant="outline" className={className}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Get appropriate button variant based on component variant
  const getButtonVariant = () => {
    switch (variant) {
      case 'compact':
        return 'ghost';
      case 'navbar':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  // Render the trigger button based on the variant
  const renderTrigger = () => {
    switch (variant) {
      case 'compact':
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        );
      case 'navbar':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="w-72 text-left justify-start bg-background/50 border-border/50 px-3"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="text-muted-foreground">{placeholder}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        );
      case 'inline':
        return (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              onClick={() => setOpen(true)}
              className="pl-10 w-full bg-background/50 border-border/50"
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        );
      default:
        return (
          <Button
            variant="default"
            onClick={() => setOpen(true)}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {placeholder}
          </Button>
        );
    }
  };
  
  return (
    <>
      {/* Search trigger */}
      {renderTrigger()}
      
      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col h-full">
          {/* Search input and filters */}
          <div className="border-b border-border">
            <div className="flex gap-2 p-2">
              <div className="flex-1 flex items-center bg-muted rounded-md">
                <Search className="h-4 w-4 ml-3 text-muted-foreground" />
                <CommandInput 
                  ref={inputRef}
                  placeholder={placeholder}
                  value={query}
                  onValueChange={setQuery}
                  className="border-none shadow-none focus-visible:ring-0"
                />
              </div>
              
              <Button variant="outline" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search filters */}
            <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(null)}
                className="h-7 px-2 text-xs rounded-full"
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                All
              </Button>
              <Button
                variant={activeFilter === 'items' ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter('items')}
                className="h-7 px-2 text-xs rounded-full"
              >
                <Package className="h-3.5 w-3.5 mr-1" />
                Items
              </Button>
              <Button
                variant={activeFilter === 'reports' ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter('reports')}
                className="h-7 px-2 text-xs rounded-full"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Reports
              </Button>
              <Button
                variant={activeFilter === 'users' ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter('users')}
                className="h-7 px-2 text-xs rounded-full"
              >
                <User className="h-3.5 w-3.5 mr-1" />
                Users
              </Button>
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search results */}
          <CommandList className="flex-1 overflow-y-auto">
            {query.length > 1 ? (
              <>
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <CommandGroup heading="Search Results">
                    <AnimatePresence>
                      {results.map((result) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CommandItem
                            onSelect={() => handleResultClick(result)}
                            className="flex items-start py-3 px-4"
                          >
                            <div className="flex-shrink-0 mr-3">
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                {renderResultIcon(result.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium truncate">
                                  {result.title}
                                </p>
                                {result.date && (
                                  <p className="text-xs text-muted-foreground">
                                    <CalendarRange className="inline-block h-3 w-3 mr-1" />
                                    {result.date}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {result.description}
                              </p>
                              {result.uniqueId && (
                                <p className="text-xs text-primary font-mono mt-1">
                                  ID: {result.uniqueId}
                                </p>
                              )}
                              <div className="flex space-x-2 mt-2">
                                {result.category && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                                    {result.category}
                                  </Badge>
                                )}
                                {renderStatusBadge(result.status)}
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CommandItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CommandGroup>
                ) : (
                  <CommandEmpty>
                    <div className="flex flex-col items-center justify-center py-8">
                      <Search className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No results found for <strong>"{query}"</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try entering a complete unique ID such as an IMEI number or document ID
                      </p>
                      
                      <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                        <kbd className="rounded border border-border/50 bg-muted px-1.5">
                          <span className="text-xs">Tab</span>
                        </kbd>
                        <span>+</span>
                        <kbd className="rounded border border-border/50 bg-muted px-1.5">
                          <span className="text-xs">Enter</span>
                        </kbd>
                        <span>for instant search</span>
                      </div>
                      
                      {/* Search tips based on query type */}
                      <div className="mt-4 p-3 bg-muted/50 rounded-md text-left max-w-md w-full mx-4">
                        <div className="flex items-center mb-1">
                          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="font-medium text-sm">Search Tips</span>
                        </div>
                        
                        {/^\d+$/.test(query) && query.length < 15 && (
                          <p className="text-xs text-muted-foreground">
                            For IMEI numbers, ensure you enter all 15-17 digits without spaces or special characters.
                          </p>
                        )}
                        
                        {/^[A-Za-z0-9\-]{1,5}$/.test(query) && (
                          <p className="text-xs text-muted-foreground">
                            Your search is too short. Document IDs typically contain 6 or more characters.
                          </p>
                        )}
                        
                        {/^s[n/]?[-:]?/i.test(query) && query.length < 9 && (
                          <p className="text-xs text-muted-foreground">
                            For serial numbers, make sure to include the complete number after the "SN" prefix.
                          </p>
                        )}
                        
                        {!/^\d+$/.test(query) && !/^[A-Za-z0-9\-\/]+$/.test(query) && (
                          <p className="text-xs text-muted-foreground">
                            Make sure your search only contains letters, numbers, and common separators like hyphens.
                          </p>
                        )}
                        
                        {(query.includes(' ') || query.includes(',')) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Remove spaces or commas from your search term for better results.
                          </p>
                        )}
                      </div>
                    </div>
                  </CommandEmpty>
                )}
              </>
            ) : recentSearches.length > 0 ? (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search, i) => (
                  <CommandItem
                    key={`${search.query}-${i}`}
                    onSelect={() => handleRecentSearchClick(search)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{search.query}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => removeRecentSearch(e, search.query)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Start typing to search
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for items by unique identifiers
                </p>
                <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                  <kbd className="rounded border border-border/50 bg-muted px-1.5">
                    <span className="text-xs">Tab</span>
                  </kbd>
                  <span>+</span>
                  <kbd className="rounded border border-border/50 bg-muted px-1.5">
                    <span className="text-xs">Enter</span>
                  </kbd>
                  <span>for instant search</span>
                </div>
                
                {/* Helpful search tips for unique IDs */}
                <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-md px-4">
                  <div className="bg-muted/50 p-3 rounded-md text-left">
                    <div className="flex items-center mb-1">
                      <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium text-sm">IMEI Number</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      15-17 digits found under battery or by dialing *#06#
                    </p>
                    <code className="text-xs bg-background px-1 py-0.5 rounded mt-1 block">Example: 352022119378450</code>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md text-left">
                    <div className="flex items-center mb-1">
                      <FileText className="h-4 w-4 mr-2 text-green-500" />
                      <span className="font-medium text-sm">Document ID</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alphanumeric ID found on official documents
                    </p>
                    <code className="text-xs bg-background px-1 py-0.5 rounded mt-1 block">Example: RW-1198743-2023</code>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md text-left">
                    <div className="flex items-center mb-1">
                      <ScanLine className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="font-medium text-sm">Serial Number</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Product serial number typically found on the device or packaging
                    </p>
                    <code className="text-xs bg-background px-1 py-0.5 rounded mt-1 block">Example: SN-XC7992-83A</code>
                  </div>
                </div>
              </div>
            )}
          </CommandList>
          
          {/* Search footer */}
          <div className="border-t border-border p-2 text-xs text-muted-foreground flex justify-between">
            <div>
              Press <kbd className="rounded border border-border/50 bg-muted px-1 mx-1">↑</kbd>
              <kbd className="rounded border border-border/50 bg-muted px-1 mx-1">↓</kbd> to navigate
            </div>
            <div>
              Press <kbd className="rounded border border-border/50 bg-muted px-1 mx-1">Enter</kbd> to select
            </div>
            <div>
              Press <kbd className="rounded border border-border/50 bg-muted px-1 mx-1">Esc</kbd> to close
            </div>
          </div>
        </div>
      </CommandDialog>
    </>
  );
};