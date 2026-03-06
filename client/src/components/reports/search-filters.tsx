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
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Common item categories
const CATEGORIES = [
  { label: "filters.allCategories", value: "All Categories" },
  { label: "item_category_electronics", value: "Electronics" },
  { label: "item_category_documents", value: "Documents" },
  { label: "item_category_clothing", value: "Clothing" },
  { label: "item_category_jewelry", value: "Jewelry" },
  { label: "item_category_keys", value: "Keys" },
  { label: "item_category_bags", value: "Bags & Wallets" },
  { label: "item_category_other", value: "Other" }
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
  const { t } = useTranslation();
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
          className="flex items-center gap-2 rounded-xl border-neutral-200 shadow-sm"
        >
          <Filter className="h-4 w-4" />
          {t('filters.title')}
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl text-neutral-500 hover:text-neutral-900">
            <X className="h-4 w-4 mr-1" />
            {t('filters.clear')}
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className={cn(
        "gap-3",
        orientation === "vertical" ? "flex flex-col" : "flex flex-col md:flex-row md:items-center",
        orientation === "horizontal" && "bg-card/50 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-sm",
        showFilters || orientation === "vertical" ? 'flex' : 'hidden md:flex'
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full bg-background/40 backdrop-blur-md border-border/50 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder={t('filters.category')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="rounded-lg text-xs">{t(cat.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-full bg-background/40 backdrop-blur-md border-border/50 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder={t('filters.location')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc} className="rounded-lg text-xs">
                  {loc === "All Locations" ? t('filters.allLocations') : loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full bg-background/40 backdrop-blur-md border-border/50 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder={t('filters.sortBy')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              <SelectItem value="newest" className="rounded-lg text-xs">{t('filters.newest')}</SelectItem>
              <SelectItem value="oldest" className="rounded-lg text-xs">{t('filters.oldest')}</SelectItem>
              <SelectItem value="relevance" className="rounded-lg text-xs">{t('filters.relevance')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Select value={dateFilter} onValueChange={handleDateChange}>
            <SelectTrigger className="w-full bg-background/40 backdrop-blur-md border-border/50 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder={t('filters.time')} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
              <SelectItem value="all" className="rounded-lg text-xs">{t('filters.allTime')}</SelectItem>
              <SelectItem value="24h" className="rounded-lg text-xs">{t('filters.last24h')}</SelectItem>
              <SelectItem value="7d" className="rounded-lg text-xs">{t('filters.last7d')}</SelectItem>
              <SelectItem value="30d" className="rounded-lg text-xs">{t('filters.last30d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters (Desktop) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden md:flex items-center h-9 px-4 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50 transition-colors text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {t('filters.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
