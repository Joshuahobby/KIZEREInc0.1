import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, Filter, MapPin, Tag, X, ArrowUpDown } from "lucide-react";

// Common item categories in Rwanda
const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Documents",
  "Clothing",
  "Jewelry",
  "Keys",
  "Bags & Wallets",
  "Other"
];

// Common locations in Rwanda
const LOCATIONS = [
  "All Locations",
  "Kigali City",
  "Nyarugenge",
  "Gasabo",
  "Kicukiro",
  "Huye",
  "Rubavu",
  "Musanze",
  "Rwamagana"
];

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  category: string;
  location: string;
  sortBy: "newest" | "oldest" | "relevance";
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [category, setCategory] = useState("All Categories");
  const [location, setLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "relevance">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFiltersChange({ category: value, location, sortBy });
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onFiltersChange({ category, location: value, sortBy });
  };

  const handleSortChange = (value: "newest" | "oldest" | "relevance") => {
    setSortBy(value);
    onFiltersChange({ category, location, sortBy: value });
  };

  const clearFilters = () => {
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("newest");
    onFiltersChange({ 
      category: "All Categories", 
      location: "All Locations", 
      sortBy: "newest" 
    });
  };

  const hasActiveFilters = 
    category !== "All Categories" || 
    location !== "All Locations" || 
    sortBy !== "newest";

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center justify-between md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              !
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className={`flex flex-col md:flex-row gap-3 ${showFilters ? 'block' : 'hidden md:flex'}`}>
        <div className="flex items-center gap-2 flex-1">
          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="relevance">Most Relevant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters (Desktop) */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="hidden md:flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
