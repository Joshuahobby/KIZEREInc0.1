import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from '../../hooks/use-debounce';
import { createLogger } from '@/lib/logger';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiGet } from '@/lib/api';
import {
  Search,
  LayoutGrid,
  Clock,
  ArrowUpRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  X,
  User,
  SlidersHorizontal,
  Smartphone,
  FileText,
  ScanLine,
  Keyboard
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
  className?: string;
  onSearch?: (query: string) => void;
}

/**
 * Global Search Component
 * 
 * A powerful search interface with suggestions, filters, and recent searches.
 * This component provides both a trigger button and a command palette.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder,
  variant = 'default',
  className,
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
  const { t } = useLanguage();

  // Localized defaults
  const searchPlaceholder = placeholder || t('search.placeholder');

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
        const data = await apiGet<{ results: any[]; total: number; page: number; totalPages: number }>(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}${activeFilter ? `&status=${activeFilter}` : ''}`,
          { showErrorToast: false }
        );

        if (!data) {
          setResults([]);
          return;
        }

        // Map API results to SearchResult interface
        const mappedResults: SearchResult[] = data.results.map((item: any) => ({
          id: String(item.id),
          type: item.type === 'registered' ? 'item' : 'report',
          title: item.name || item.title || 'Untitled',
          description: item.description || '',
          category: item.category,
          status: item.status,
          date: item.registeredAt || item.reportedAt ? new Date(item.registeredAt || item.reportedAt).toLocaleDateString() : undefined,
          imageUrl: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : undefined,
          url: item.type === 'registered' ? `/items/${item.id}` : `/reports/${item.id}`,
          uniqueId: item.uniqueIdentifier
        }));

        setResults(mappedResults);
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

  // Handle clicking a search tip to pre-fill the query
  const handleTipClick = (example: string) => {
    setQuery(example);
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
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  // Render the status badge for a result
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;

    let badgeClass = '';
    let icon = null;

    switch (status.toLowerCase()) {
      case 'registered':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        icon = <Package className="h-3 w-3 mr-1" />;
        break;
      case 'active':
      case 'lost':
        badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
      case 'found':
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case 'resolved':
        badgeClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      default:
        badgeClass = 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }

    return (
      <Badge variant="outline" className={cn("text-[10px] font-medium h-5", badgeClass)}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
            aria-label={t('nav.search')}
            className="rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200"
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
            className={cn(
              "w-full sm:w-72 text-left justify-start bg-background/50 border-border/50 px-3 shadow-none hover:bg-background/80 hover:border-border transition-all duration-300 group",
              className
            )}
          >
            <Search className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-muted-foreground truncate">{searchPlaceholder}</span>
            <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
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
              placeholder={searchPlaceholder}
              onClick={() => setOpen(true)}
              className="pl-10 w-full bg-background/50 border-border/50 cursor-pointer"
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        );
      default:
        return (
          <Button
            variant="default"
            onClick={() => setOpen(true)}
            className="w-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Search className="h-4 w-4 mr-2" />
            {searchPlaceholder}
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
          {/* Search Header */}
          <div className="p-4 flex items-center gap-3 border-b bg-card/50">
            <div className="relative flex-1">
              <CommandInput
                ref={inputRef}
                placeholder={t('search.actions.typeId') || searchPlaceholder}
                value={query}
                onValueChange={setQuery}
                className="h-10 w-full bg-muted/50 border-none shadow-none focus-visible:ring-0 rounded-lg text-sm transition-all focus:bg-muted"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-full hover:bg-muted transition-colors mr-1"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all group/scan"
                  title={t('search.actions.scan') || "Scan ID"}
                >
                  <ScanLine className="h-4 w-4 group-hover/scan:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b bg-background/50">
            {[
              { id: null, label: t('search.filters.all'), icon: LayoutGrid },
              { id: 'item', label: t('search.filters.items'), icon: Package },
              { id: 'report', label: t('search.filters.reports'), icon: AlertTriangle },
              { id: 'user', label: t('search.filters.users'), icon: User },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  activeFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
            <div className="ml-auto pl-2 border-l border-border/50">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('search.filters.advanced')}</span>
              </Button>
            </div>
          </div>

          {/* Body Content */}
          <CommandList className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <AnimatePresence mode="wait">
              {query.length > 1 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-4">
                          <Skeleton className="h-12 w-12 rounded-xl" />
                          <div className="space-y-2 flex-1 pt-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <CommandGroup heading={t('search.title')}>
                      {results.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-4 p-3 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors group border border-transparent hover:border-border/50 mb-1 last:mb-0"
                        >
                          <div className="shrink-0">
                            <div className="h-12 w-12 rounded-xl bg-muted/80 flex items-center justify-center group-hover:bg-background transition-colors shadow-sm ring-1 ring-transparent group-hover:ring-border/20">
                              {renderResultIcon(result.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                {result.title}
                              </h4>
                              {result.date && (
                                <span className="shrink-0 text-[10px] text-muted-foreground/70 flex items-center mt-1">
                                  <CalendarRange className="h-3 w-3 mr-1" />
                                  {result.date}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {result.description || t('common.description')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {renderStatusBadge(result.status)}
                              {result.uniqueId && (
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted h-5 px-1.5 rounded flex items-center">
                                  ID: {result.uniqueId}
                                </span>
                              )}
                              {result.category && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-background border border-border/50 text-muted-foreground">
                                  {result.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-4 w-4 text-primary" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">
                        {t('search.empty.noResults', { query })}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-[240px]">
                        {t('search.empty.tryID')}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : recentSearches.length > 0 ? (
                <motion.div
                  key="recent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CommandGroup heading={t('common.recentActivity')}>
                    {recentSearches.map((search, i) => (
                      <CommandItem
                        key={`${search.query}-${i}`}
                        onSelect={() => handleRecentSearchClick(search)}
                        className="flex items-center justify-between p-2.5 rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                          <span className="text-sm">{search.query}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                          onClick={(e) => removeRecentSearch(e, search.query)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2"
                >
                  {/* Quick Action Buttons for Rwanda Market */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                      {t('search.actions.quickId') || "Quick ID Search"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'IMEI', icon: Smartphone, label: t('search.labels.imei'), color: 'bg-blue-500/10 text-blue-500' },
                        { id: 'NID', icon: FileText, label: t('search.labels.nid'), color: 'bg-emerald-500/10 text-emerald-500' },
                        { id: 'Serial', icon: ScanLine, label: t('search.labels.serial'), color: 'bg-purple-500/10 text-purple-500' },
                        { id: 'Doc', icon: FileText, label: t('search.labels.docId'), color: 'bg-amber-500/10 text-amber-500' },
                      ].map((action) => (
                        <Button
                          key={action.id}
                          variant="ghost"
                          className="h-auto py-4 flex-col gap-2 rounded-2xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group/item"
                          onClick={() => handleTipClick(action.id + ': ')}
                        >
                          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110", action.color.split(' ')[0])}>
                            <action.icon className={cn("h-6 w-6", action.color.split(' ')[1])} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-tight group-hover/item:text-primary transition-colors">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
};
