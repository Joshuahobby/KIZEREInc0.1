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
import { Calendar, Filter, MapPin, Tag as TagIcon, X, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Badge } from "@/components/ui/badge";

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
  { label: "filters.allTime", value: "all" },
  { label: "filters.last24h", value: "24h" },
  { label: "filters.last7d", value: "7d" },
  { label: "filters.last30d", value: "30d" }
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
    <div className={cn(
      "w-full bg-card/40 backdrop-blur-xl border border-border/40 p-1.5 md:p-2 rounded-2xl shadow-premium transition-all",
      orientation === "vertical" ? "flex flex-col space-y-2" : "flex flex-col md:flex-row items-stretch md:items-center gap-2"
    )}>
      {/* Category Filter */}
      <div className="flex-1 md:max-w-[220px]">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-primary" />
              <SelectValue placeholder={t('filters.category')} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value} className="rounded-lg text-xs font-medium cursor-pointer">
                {t(cat.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="flex-1 md:max-w-[200px]">
        <Select value={location} onValueChange={handleLocationChange}>
          <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <SelectValue placeholder={t('filters.location')} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
            {LOCATIONS.map(loc => (
              <SelectItem key={loc} value={loc} className="rounded-lg text-xs font-medium cursor-pointer">
                {loc === "All Locations" ? t('filters.allLocations') : loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Filter */}
      <div className="flex-1 md:max-w-[180px]">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <SelectValue placeholder={t('filters.sortBy')} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
            <SelectItem value="newest" className="rounded-lg text-xs font-medium cursor-pointer">{t('filters.newest')}</SelectItem>
            <SelectItem value="oldest" className="rounded-lg text-xs font-medium cursor-pointer">{t('filters.oldest')}</SelectItem>
            <SelectItem value="relevance" className="rounded-lg text-xs font-medium cursor-pointer">{t('filters.relevance')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Filter */}
      <div className="flex-1 md:max-w-[180px]">
        <Select value={dateFilter} onValueChange={handleDateChange}>
          <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <SelectValue placeholder={t('filters.time')} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
            {TIME_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value} className="rounded-lg text-xs font-medium cursor-pointer">
                {t(range.label) || range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all text-xs font-bold group"
        >
          <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          <span className="md:hidden lg:inline">{t('filters.clear')}</span>
        </Button>
      )}
    </div>
  );
}
