import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Item, Report } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Calendar, Tag, MapPin, ChevronRight, List, Map as MapIcon, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { SearchFilters } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import MapView from "@/components/search/map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Search() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<any>({});

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
    // Enable query even without initial search to show "all" if desired, or keep as is
    enabled: Object.keys(filters).length > 0 || viewMode === 'map',
  });

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <PageLayout>
      <div className="py-6 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-display font-semibold text-neutral-900">Search & Discovery</h1>
              <p className="mt-1 text-sm text-neutral-500">Find items, lost reports, and more using advanced filters.</p>
            </div>

            <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="w-4 h-4" /> List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="gap-2"
              >
                <MapIcon className="w-4 h-4" /> Map
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left Sidebar: Filters */}
            <div className="lg:col-span-1">
              <SearchFilters onSearch={handleSearch} initialFilters={filters} />
            </div>

            {/* Right Content: Results */}
            <div className="lg:col-span-3 h-full flex flex-col">
              {isLoading ? (
                <div className="flex justify-center p-12 h-64 items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {viewMode === 'list' ? (
                    <div className="space-y-4">
                      {searchResults && searchResults.length > 0 ? (
                        <>
                          <p className="text-sm text-neutral-500">Found {searchResults.length} results</p>
                          <motion.div
                            className="grid gap-4"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  staggerChildren: 0.1
                                }
                              }
                            }}
                          >
                            {searchResults.map((item: any) => {
                              // Determine link based on type
                              const link = item.type === 'registered' ? `/items/${item.id}` : `/reports/${item.id}`;
                              const badgeClass = item.status === 'Open' || item.status === 'Registered' ? 'bg-green-100 text-green-800' :
                                item.status === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';

                              return (
                                <motion.div key={`${item.type}-${item.id}`} variants={{
                                  hidden: { opacity: 0, y: 20 },
                                  visible: { opacity: 1, y: 0 }
                                }}>
                                  <Link href={link}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h3 className="font-semibold text-lg text-primary">{item.title}</h3>
                                            <p className="text-sm text-neutral-500 line-clamp-1">{item.description}</p>

                                            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
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
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
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
                        >
                          <Card className="bg-muted/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
                              <Layers className="w-12 h-12 mb-4 opacity-20" />
                              <p className="text-lg font-medium">No results found</p>
                              <p className="text-sm">Try adjusting your filters or search terms.</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[600px] w-full border rounded-lg overflow-hidden shadow-sm relative">
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
