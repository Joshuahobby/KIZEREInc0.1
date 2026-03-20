import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Item, Report } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Loader2, Calendar, Tag as TagIcon, MapPin, ChevronRight, List, Map as MapIcon, Layers, Search as SearchIcon, Smartphone, FileText, Hash, Package, Eye, PackageSearch, Lock, Shield, Key, Wallet, Briefcase, Shirt, Car, Laptop, Gem } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { SearchFilters } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapView from "@/components/search/map-view";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { cn } from "@/lib/utils";

const getCategoryIcon = (category: string, className: string) => {
  if (!category) return <Package className={className} />;
  switch (category.toLowerCase()) {
    case 'phones':
    case 'electronics': return <Smartphone className={className} />;
    case 'keys': return <Key className={className} />;
    case 'wallets': return <Wallet className={className} />;
    case 'documents': return <FileText className={className} />;
    case 'jewelry': return <Gem className={className} />;
    case 'clothing': return <Shirt className={className} />;
    case 'bags':
    case 'accessories': return <Briefcase className={className} />;
    case 'computers': return <Laptop className={className} />;
    case 'transportation': return <Car className={className} />;
    default: return <Package className={className} />;
  }
};

export default function Search() {
  const { t } = useLanguage();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, navigate] = useLocation();
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
    // Only fetch search results if the user is authenticated
    enabled: user !== null, // Changed from isAuthenticated to user !== null
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
      <SEO 
        title={filters.type === 'lost' ? "KIZERE - Lost Items Directory" : filters.type === 'found' ? "KIZERE - Found Items Directory" : "KIZERE - Explore Items"}
        description="Search through Rwandan lost and found items. Use our advanced search to reconnect with your missing property."
      />
      <div className="py-4 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
          {!user && !isLoadingAuth ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <AuthWall returnUrl="/search" />
            </div>
          ) : (
            <>
              {/* Spatial Hero Search Section */}
              <div className="relative overflow-hidden rounded-[2rem] bg-card/40 backdrop-blur-3xl border border-border/40 p-6 sm:p-10 mb-6 shadow-2xl group transition-all duration-700 hover:shadow-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-primary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Glowing orbs for depth */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-60 mix-blend-screen" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-60 mix-blend-screen" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-5">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase shadow-inner">
                    <SearchIcon className="w-4 h-4" />
                    <span>{t('nav.exploreHeader')}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.1]">
                    {filters.type === 'lost' ? t('searchPage.lostTitle') :
                      filters.type === 'found' ? t('searchPage.foundTitle') :
                        t('searchPage.title')}
                  </h1>

                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl font-medium tracking-wide">
                    {filters.type === 'lost' ? t('searchPage.lostSubtitle') :
                      filters.type === 'found' ? t('searchPage.foundSubtitle') :
                        t('searchPage.subtitle')}
                  </p>

                  <div className="w-full max-w-2xl relative mt-4 group/search">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/70" />
                    <Input
                      className="w-full h-14 pl-14 pr-6 rounded-2xl bg-background/90 backdrop-blur-xl border-2 border-border/50 hover:border-primary/40 focus:border-primary transition-all text-lg shadow-xl font-medium placeholder:text-muted-foreground/60"
                      placeholder={t('searchFilters.searchPlaceholder')}
                      value={filters.q || ''}
                      onChange={(e) => handleSearch({ ...filters, q: e.target.value })}
                    />
                  </div>


                </div>
              </div>

              <div className="flex flex-col gap-6 h-full">
                {/* Top Bar: Horizontal Filters (Dock Style) */}
                <div className="w-full sticky top-20 z-30">
                  <SearchFilters 
                    onSearch={handleSearch} 
                    initialFilters={filters} 
                    layout="horizontal" 
                    hideSearchInput={true} 
                    viewModeAction={
                      <div className="flex bg-background/50 border border-border/30 p-0.5 rounded-xl shrink-0 shadow-sm mr-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                            viewMode === 'list'
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <List className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('searchPage.list')}</span>
                        </button>
                        <button
                          onClick={() => setViewMode('map')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                            viewMode === 'map'
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('searchPage.map')}</span>
                        </button>
                      </div>
                    }
                  />
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
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-2 pb-10"
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
                                        <Card className="h-full flex flex-col overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 group cursor-pointer relative">
                                          {/* Image Header / Top Banner */}
                                          <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-4">
                                            {item.imageUrls && item.imageUrls.length > 0 ? (
                                              <img
                                                src={item.imageUrls[0]}
                                                alt={item.title || item.name}
                                                width={400}
                                                height={300}
                                                loading="lazy"
                                                decoding="async"
                                                className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal transition-transform duration-1000 group-hover:scale-110 drop-shadow-md"
                                              />
                                            ) : (
                                              <div className="flex items-center justify-center h-full">
                                                {getCategoryIcon(item.category || '', "h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700")}
                                              </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="absolute top-3 right-3">
                                              {(() => {
                                                const isLost = item.status === 'Open' ? item.type === 'lost' : item.status === 'Lost';
                                                const isFound = item.status === 'Open' ? item.type === 'found' : item.status === 'Found';
                                                const displayStatus = item.status === 'Open' ? (item.type === 'lost' ? 'Lost' : item.type === 'found' ? 'Found' : item.status) : item.status;
                                                
                                                const wrapperClass = isLost ? 'bg-red-50 text-destructive dark:bg-black/80 dark:text-destructive border border-destructive/30 animate-pulse' :
                                                  isFound ? 'bg-emerald-50 text-emerald-600 dark:bg-black/80 dark:text-emerald-400 border border-emerald-500/30' :
                                                  'bg-blue-50 text-blue-600 dark:bg-black/80 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
                                                  
                                                const dotClass = isLost ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                                  isFound ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                                  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';

                                                return (
                                                  <div className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md flex items-center gap-1.5 z-10 ${wrapperClass}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                                                    {displayStatus}
                                                  </div>
                                                );
                                              })()}
                                            </div>

                                            {/* Quick view button on hover */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                              <Button variant="secondary" size="sm" className="rounded-full h-9 px-5 backdrop-blur-md bg-white/20 text-white border border-white/30 hover:bg-white/40 font-bold transition-all" asChild>
                                                <div>
                                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                                  View Details
                                                </div>
                                              </Button>
                                            </div>
                                          </div>

                                          <CardContent className="p-4 pt-4 flex-1 flex flex-col">
                                            <h3 className="text-base font-black line-clamp-1 group-hover:text-primary transition-colors duration-300">
                                              {item.title || item.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">{item.description}</p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-[10px] sm:text-xs text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-primary/40" /> {format(new Date(item.date || item.registeredAt || new Date()), 'MMM d, yyyy')}
                                              </span>
                                              {item.location && (
                                                <span className="flex items-center gap-1">
                                                  <MapPin className="w-3.5 h-3.5 text-primary/40" /> {item.location}
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center mt-3 pt-3 border-t border-border/50">
                                              <div className="flex items-center text-[9px] font-black text-muted-foreground/50 tracking-widest uppercase">
                                                <TagIcon className="h-3 w-3 mr-1.5 text-primary/50" />
                                                {item.category}
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
                              <div className="w-full rounded-3xl border border-border/10 bg-card/60 backdrop-blur-xl p-16 md:p-24 flex flex-col items-center text-center shadow-premium relative overflow-hidden transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                                <div className="relative mb-8 group">
                                  <motion.div
                                    className="absolute -inset-8 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-2xl pointer-events-none"
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  <motion.div
                                    className="relative h-20 w-20 rounded-2xl bg-secondary/10 border border-border/20 flex items-center justify-center backdrop-blur-md shadow-2xl"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  >
                                    <PackageSearch className="w-10 h-10 text-muted-foreground/80 group-hover:text-primary transition-colors duration-500" />
                                  </motion.div>
                                </div>

                                <p className="text-2xl font-heading font-bold tracking-tight text-foreground mb-3 relative z-10">{t('searchPage.noResults')}</p>
                                <p className="text-muted-foreground text-base max-w-sm mb-10 font-medium leading-relaxed opacity-80 relative z-10">{t('searchPage.noResultsHint')}</p>

                                {/* Actionable Suggestions */}
                                <div className="flex flex-wrap justify-center gap-3 relative z-10">
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
                              </div>
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
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
