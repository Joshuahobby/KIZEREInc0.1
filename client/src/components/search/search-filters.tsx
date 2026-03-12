
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface SearchFiltersProps {
    onSearch: (filters: any) => void;
    initialFilters?: any;
    layout?: "vertical" | "horizontal";
    hideSearchInput?: boolean;
}

export function SearchFilters({ onSearch, initialFilters, layout = "vertical", hideSearchInput = false }: SearchFiltersProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState(initialFilters?.q || "");
    const [type, setType] = useState(initialFilters?.type || "lost"); // Default to lost/found search
    const [status, setStatus] = useState<string[]>(initialFilters?.status ? initialFilters.status.split(',') : []);
    const [category, setCategory] = useState<string[]>(initialFilters?.category ? initialFilters.category.split(',') : []);
    const [location, setLocation] = useState(initialFilters?.location || "");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: initialFilters?.startDate ? new Date(initialFilters.startDate) : undefined,
        to: initialFilters?.endDate ? new Date(initialFilters.endDate) : undefined,
    });
    const [sortBy, setSortBy] = useState(initialFilters?.sortBy || "newest");

    // Sync internal state when initialFilters changes (e.g. via URL navigation)
    useEffect(() => {
        if (initialFilters) {
            setSearchTerm(initialFilters.q || "");
            setType(initialFilters.type || "lost");
            setStatus(initialFilters.status ? initialFilters.status.split(',') : []);
            setCategory(initialFilters.category ? initialFilters.category.split(',') : []);
            setLocation(initialFilters.location || "");
            setDateRange({
                from: initialFilters.startDate ? new Date(initialFilters.startDate) : undefined,
                to: initialFilters.endDate ? new Date(initialFilters.endDate) : undefined,
            });
            setSortBy(initialFilters.sortBy || "newest");
        }
    }, [initialFilters]);

    const categories = [
        "Electronics", "Documents", "Jewelry", "Clothing", "Keys", "Other"
    ];

    const statuses = ["Open", "In_Progress", "Resolved", "Closed"];

    const handleSearch = () => {
        onSearch({
            q: searchTerm,
            type: type === "all" ? undefined : type,
            status: status.join(','),
            category: category.join(','),
            location,
            startDate: dateRange.from?.toISOString(),
            endDate: dateRange.to?.toISOString(),
            sortBy,
        });
    };

    // Auto-search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setType("all");
        setStatus([]);
        setCategory([]);
        setLocation("");
        setDateRange({ from: undefined, to: undefined });
        setSortBy("newest");
        onSearch({});
    };

    const toggleStatus = (s: string) => {
        setStatus(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
    };

    const toggleCategory = (c: string) => {
        setCategory(prev => prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c]);
    };

    if (layout === "horizontal") {
        return (
            <div className="w-full bg-card/40 backdrop-blur-xl border border-border/40 p-1.5 md:p-2 rounded-2xl shadow-premium transition-all">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                    {/* Main Search */}
                    {!hideSearchInput && (
                        <div className="flex-1 md:max-w-[280px]">
                            <div className="relative h-10 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary shrink-0" />
                                <Input
                                    placeholder={t('searchFilters.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="h-full pl-9 w-full bg-background/50 border-border/30 rounded-xl shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold"
                                />
                            </div>
                        </div>
                    )}

                    {/* Type */}
                    <div className="flex-1 md:max-w-[140px]">
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
                                <SelectValue placeholder={t('searchFilters.allTypes')} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
                                <SelectItem value="all" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.allTypes')}</SelectItem>
                                <SelectItem value="lost" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.lost')}</SelectItem>
                                <SelectItem value="found" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.found')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Popover */}
                    <div className="flex-1 md:max-w-[160px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3 justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="truncate">
                                            {category.length === 0 ? t('searchFilters.allCategories') :
                                                category.length === 1 ? category[0] :
                                                    `${category.length} ${t('searchFilters.selected')}`}
                                        </span>
                                    </div>
                                    <Filter className="ml-1.5 h-3 w-3 opacity-50 shrink-0" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-2 rounded-xl border-border/50 shadow-xl" align="start">
                                <div className="space-y-0.5">
                                    {categories.map(c => (
                                        <div key={c} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors" onClick={() => toggleCategory(c)}>
                                            <Checkbox
                                                id={`cat-h-${c}`}
                                                checked={category.includes(c)}
                                                onCheckedChange={() => toggleCategory(c)}
                                                className="rounded-md border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <label htmlFor={`cat-h-${c}`} className="text-sm font-medium leading-none cursor-pointer">
                                                {c}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Date Range - Hidden on very small mobile if too wide, or full width */}
                    <div className="flex-1 md:max-w-[160px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3 justify-start",
                                        !dateRange.from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                                    <span className="truncate">
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>
                                            ) : (
                                                format(dateRange.from, "LLL dd")
                                            )
                                        ) : (
                                            <span>{t('searchFilters.pickDate')}</span>
                                        )}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-2xl" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                    numberOfMonths={window.innerWidth > 640 ? 2 : 1}
                                    className="p-3"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Sort By - Hidden on niche screens if needed, but here full width or small */}
                    <div className="flex-1 md:max-w-[140px]">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full bg-background/50 border-border/30 rounded-xl h-10 shadow-sm focus:ring-primary/20 transition-all hover:bg-background/80 text-xs font-bold px-3">
                                <SelectValue placeholder={t('searchFilters.newest')} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
                                <SelectItem value="newest" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.newest')}</SelectItem>
                                <SelectItem value="oldest" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.oldest')}</SelectItem>
                                <SelectItem value="relevant" className="rounded-lg text-xs font-medium cursor-pointer">{t('searchFilters.mostRelevant')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <Button className="h-10 rounded-xl px-5 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs" onClick={handleSearch}>
                            {t('searchFilters.apply')}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group shrink-0" onClick={clearFilters} title={t('searchFilters.clearAll')}>
                            <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-neutral-500">
                    <X className="w-3 h-3 mr-1" /> Clear
                </Button>
            </div>

            {/* Main Search */}
            <div className="space-y-2">
                <Label>Search Term</Label>
                <Input
                    placeholder="Keyword, Serial Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Type */}
            <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="found">Found</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label>Location</Label>
                <Input
                    placeholder="City, District..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* Category (Multi-select simulation) */}
            <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                        <div key={c} className="flex items-center space-x-2">
                            <Checkbox
                                id={`cat-${c}`}
                                checked={category.includes(c)}
                                onCheckedChange={() => toggleCategory(c)}
                            />
                            <label htmlFor={`cat-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {c}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <Button className="w-full" onClick={handleSearch}>Apply Filters</Button>
        </div>
    );
}
