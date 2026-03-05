import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Item, Report } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Loader2, Calendar, Tag, MapPin, ChevronRight, List, Map as MapIcon, Layers, Search as SearchIcon, Smartphone, FileText, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { SearchFilters } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import MapView from "@/components/search/map-view";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function Search() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<any>({});
  const [, setLocation] = useLocation();

  // Initialize filters from URL on mount and whenever search params change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const newFilters: any = {};

    // Map URL params to filter state
    // Common keys: type, category, status, q, location, startDate, endDate, sortBy
    searchParams.forEach((value, key) => {
      newFilters[key] = value;
    });

    // Only update if filters have changed to avoid unnecessary re-renders
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
    }
  }, [window.location.search]);

  // Build the search query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    return params.toString();
  };

  // Search results query
  const {
    data: searchResults,
    isLoading
  } = useQuery<(Item | Report)[]>({
    queryKey: [`/api/search?${buildQueryParams()}`],
    // Always load results — show all lost & found items by default
    enabled: true,
  });

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    const queryString = params.toString();
    setLocation(queryString ? `/search?${queryString}` : '/search');
  };

  return (
    <PageLayout hideSidebar={true}>
      <div className="py-4 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
          {/* Compact Header — title + view toggle on one line */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                filters.type === 'lost' ? "bg-red-500/10" :
                  filters.type === 'found' ? "bg-green-500/10" :
                    "bg-primary/10"
              )}>
                <SearchIcon className={cn(
                  "h-4 w-4",
                  filters.type === 'lost' ? "text-red-500" :
                    filters.type === 'found' ? "text-green-500" :
                      "text-primary"
                )} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                  {filters.type === 'lost' ? t('searchPage.lostTitle') :
                    filters.type === 'found' ? t('searchPage.foundTitle') :
                      t('searchPage.title')}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filters.type === 'lost' ? t('searchPage.lostSubtitle') :
                    filters.type === 'found' ? t('searchPage.foundSubtitle') :
                      t('searchPage.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-muted/50 p-0.5 rounded-xl border border-border/30">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-1.5 h-8 rounded-lg text-xs font-bold px-3"
              >
                <List className="w-3.5 h-3.5" /> {t('searchPage.list')}
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="gap-1.5 h-8 rounded-lg text-xs font-bold px-3"
              >
                <MapIcon className="w-3.5 h-3.5" /> {t('searchPage.map')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full">
            {/* Top Bar: Horizontal Filters */}
            <div className="w-full">
              <SearchFilters onSearch={handleSearch} initialFilters={filters} layout="horizontal" />
            </div>

            {/* Content: Results */}
            <div className="h-full flex flex-col">
              {isLoading ? (
                <div className="flex justify-center p-12 h-64 items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {viewMode === 'list' ? (
                    <div className="space-y-3">
                      {searchResults && searchResults.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                              {searchResults.length} {t('searchPage.resultsFound')}
                            </span>
                          </div>
                          <motion.div
                            className="grid gap-3"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  staggerChildren: 0.07
                                }
                              }
                            }}
                          >
                            {searchResults.map((item: any) => {
                              // Determine link based on type
                              const link = item.type === 'registered' ? `/items/${item.id}` : `/reports/${item.id}`;
                              const badgeClass = item.status === 'Open' || item.status === 'Registered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                item.status === 'Lost' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';

                              return (
                                <motion.div key={`${item.type}-${item.id}`} variants={{
                                  hidden: { opacity: 0, y: 15 },
                                  visible: { opacity: 1, y: 0 }
                                }}>
                                  <Link href={link}>
                                    <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>

                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                              {item.location && (
                                                <span className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" /> {item.location}
                                                </span>
                                              )}
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {format(new Date(item.date), 'MMM d, yyyy')}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {item.category}
                                              </span>
                                            </div>
                                          </div>
                                          <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                                            {item.status}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-muted/20 border-dashed border-border/50">
                            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 mb-5">
                                <SearchIcon className="w-7 h-7 text-primary/40" />
                              </div>
                              <p className="text-lg font-bold text-foreground/80 mb-1">{t('searchPage.noResults')}</p>
                              <p className="text-sm text-muted-foreground mb-6 max-w-md">{t('searchPage.noResultsHint')}</p>

                              {/* Actionable Suggestions */}
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl gap-2 text-xs font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5"
                                  onClick={() => handleSearch({ q: 'IMEI:', type: 'lost' })}
                                >
                                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                                  {t('searchPage.tryIMEI')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl gap-2 text-xs font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5"
                                  onClick={() => handleSearch({ q: '', type: 'found' })}
                                >
                                  <Layers className="h-3.5 w-3.5 text-primary" />
                                  {t('searchPage.browseFound')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl gap-2 text-xs font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5"
                                  onClick={() => handleSearch({ q: '', type: 'lost' })}
                                >
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  {t('searchPage.browseLost')}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[600px] w-full border rounded-xl overflow-hidden shadow-sm relative">
                      {searchResults && <MapView items={searchResults} className="h-full w-full" />}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
