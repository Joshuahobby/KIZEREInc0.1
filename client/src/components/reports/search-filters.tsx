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
  orientation?: "horizontal" | "vertical";
}

export interface FilterState {
  category: string;
  location: string;
  sortBy: "newest" | "oldest" | "relevance";
  dateFilter: string;
}

const TIME_RANGES = [
  { label: "All Time", value: "all" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" }
];

export function SearchFilters({ onFiltersChange, orientation = "horizontal" }: SearchFiltersProps) {
  const [category, setCategory] = useState("All Categories");
  const [location, setLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "relevance">("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFiltersChange({ category: value, location, sortBy, dateFilter });
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onFiltersChange({ category, location: value, sortBy, dateFilter });
  };

  const handleSortChange = (value: "newest" | "oldest" | "relevance") => {
    setSortBy(value);
    onFiltersChange({ category, location, sortBy: value, dateFilter });
  };

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    onFiltersChange({ category, location, sortBy, dateFilter: value });
  };

  const clearFilters = () => {
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("newest");
    setDateFilter("all");
    onFiltersChange({
      category: "All Categories",
      location: "All Locations",
      sortBy: "newest",
      dateFilter: "all"
    });
  };

  const hasActiveFilters =
    category !== "All Categories" ||
    location !== "All Locations" ||
    sortBy !== "newest" ||
    dateFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center justify-between md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-full border-neutral-200 shadow-sm"
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full text-neutral-500 hover:text-neutral-900">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className={`flex gap-3 ${orientation === "vertical" ? "flex-col" : "flex-col md:flex-row"} ${showFilters || orientation === "vertical" ? 'block' : 'hidden md:flex'}`}>
        <div className="flex items-center gap-2 flex-1">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/80 backdrop-blur-sm border-neutral-200/60 rounded-full h-12 shadow-sm focus:ring-primary/30 transition-all hover:bg-white text-neutral-700 font-medium">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary/70" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/80 backdrop-blur-sm border-neutral-200/60 rounded-full h-12 shadow-sm focus:ring-primary/30 transition-all hover:bg-white text-neutral-700 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc} className="rounded-lg">{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-white/80 backdrop-blur-sm border-neutral-200/60 rounded-full h-12 shadow-sm focus:ring-primary/30 transition-all hover:bg-white text-neutral-700 font-medium">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-primary/70" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
              <SelectItem value="oldest" className="rounded-lg">Oldest First</SelectItem>
              <SelectItem value="relevance" className="rounded-lg">Most Relevant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Select value={dateFilter} onValueChange={handleDateChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-white/80 backdrop-blur-sm border-neutral-200/60 rounded-full h-12 shadow-sm focus:ring-primary/30 transition-all hover:bg-white text-neutral-700 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/70" />
                <SelectValue placeholder="Time" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value} className="rounded-lg">{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters (Desktop) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden md:flex items-center h-12 px-5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50 transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
