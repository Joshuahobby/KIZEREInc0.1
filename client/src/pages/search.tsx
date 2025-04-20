import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Item } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Search as SearchIcon, Calendar, Tag, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [category, setCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [location, setLocation] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Build the search query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.append("q", searchTerm);
    }
    
    if (searchType !== "all") {
      params.append("status", searchType === "registered" ? "Registered" : 
                             searchType === "lost" ? "Lost" : "Found");
    }
    
    if (category && category !== "any") {
      params.append("category", category);
    }
    
    if (location) {
      params.append("location", location);
    }
    
    // TODO: Implement date filtering on the server side
    
    return params.toString();
  };
  
  // Search results query
  const {
    data: searchResults,
    isLoading,
    refetch
  } = useQuery<Item[]>({
    queryKey: [`/api/search?${buildQueryParams()}`],
    enabled: isSearching,
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    refetch();
  };
  
  // Handle reset form
  const handleReset = () => {
    setSearchTerm("");
    setSearchType("all");
    setCategory("");
    setDateFilter("");
    setLocation("");
    setIsSearching(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-display font-semibold text-neutral-900">Search Items</h1>
            <p className="mt-1 text-sm text-neutral-500">Find registered items or check if a found item has been reported.</p>

            <Card className="mt-6">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="search-term" className="block text-sm font-medium text-neutral-700">Search Term</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                        <Input
                          id="search-term"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          placeholder="Enter item name, ID, serial number..."
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="search-type" className="block text-sm font-medium text-neutral-700">Search Type</label>
                      <div className="mt-1">
                        <Select value={searchType} onValueChange={setSearchType}>
                          <SelectTrigger id="search-type">
                            <SelectValue placeholder="All Items" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="registered">Registered Only</SelectItem>
                            <SelectItem value="lost">Lost Items</SelectItem>
                            <SelectItem value="found">Found Items</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6 pt-2">
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 flex items-center text-primary-600"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      >
                        <svg
                          className={`h-5 w-5 mr-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Advanced Filters
                      </Button>
                      
                      {showAdvancedFilters && (
                        <div className="mt-3 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="category-filter" className="block text-sm font-medium text-neutral-700">Category</label>
                            <div className="mt-1">
                              <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category-filter">
                                  <SelectValue placeholder="Any Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Category</SelectItem>
                                  <SelectItem value="electronics">Electronics</SelectItem>
                                  <SelectItem value="documents">Documents</SelectItem>
                                  <SelectItem value="jewelry">Jewelry</SelectItem>
                                  <SelectItem value="accessories">Accessories</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="date-filter" className="block text-sm font-medium text-neutral-700">Date Registered</label>
                            <div className="mt-1">
                              <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger id="date-filter">
                                  <SelectValue placeholder="Any Time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Time</SelectItem>
                                  <SelectItem value="today">Today</SelectItem>
                                  <SelectItem value="week">This Week</SelectItem>
                                  <SelectItem value="month">This Month</SelectItem>
                                  <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="location-filter" className="block text-sm font-medium text-neutral-700">Location</label>
                            <div className="mt-1">
                              <Input
                                id="location-filter"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, region, country..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="mr-3"
                    >
                      Reset
                    </Button>
                    <Button type="submit">
                      Search
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Search Results */}
            {isSearching && (
              <div className="mt-8">
                <h2 className="text-lg leading-6 font-display font-medium text-neutral-900">Search Results</h2>
                {isLoading ? (
                  <div className="mt-4 flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <>
                    <p className="text-sm text-neutral-500 mt-1">Found {searchResults.length} items matching your criteria</p>
                    <Card className="mt-4">
                      <CardContent className="p-0">
                        <ul role="list" className="divide-y divide-gray-200">
                          {searchResults.map((item) => (
                            <li key={item.id}>
                              <Link href={`/items/${item.id}`}>
                                <a className="block hover:bg-gray-50">
                                  <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-primary-600 truncate">{item.name}</p>
                                      <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          item.status === 'Registered' ? 'bg-green-100 text-green-800' : 
                                          item.status === 'Lost' ? 'bg-red-100 text-red-800' : 
                                          'bg-amber-100 text-amber-800'
                                        }`}>
                                          {item.status}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                      <div className="sm:flex">
                                        {item.location && (
                                          <p className="flex items-center text-sm text-neutral-500">
                                            <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                            <span>{item.location}</span>
                                          </p>
                                        )}
                                        <p className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0 sm:ml-6">
                                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                          <span>{format(new Date(item.registeredAt), 'MMM d, yyyy')}</span>
                                        </p>
                                        <p className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0 sm:ml-6">
                                          <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                          <span>{item.category}</span>
                                        </p>
                                      </div>
                                      <div className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0">
                                        <ChevronRight className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                                        View details
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="mt-4">
                    <CardContent className="p-8 text-center">
                      <p className="text-neutral-500">No items found matching your search criteria.</p>
                      <p className="text-sm text-neutral-400 mt-2">Try adjusting your search terms or filters.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
