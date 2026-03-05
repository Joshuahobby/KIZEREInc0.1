
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
}

export function SearchFilters({ onSearch, initialFilters, layout = "vertical" }: SearchFiltersProps) {
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
            <div className="bg-card/50 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm w-full">
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-3">
                    {/* Main Search */}
                    <div className="sm:flex-1 space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold opacity-50 ml-1">{t('searchFilters.searchTerm')}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <Input
                                placeholder={t('searchFilters.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-10 pl-9 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/20 text-sm"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div className="sm:w-[120px] space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold opacity-50 ml-1">{t('searchFilters.type')}</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-sm">
                                <SelectValue placeholder={t('searchFilters.allTypes')} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50">
                                <SelectItem value="all">{t('searchFilters.allTypes')}</SelectItem>
                                <SelectItem value="lost">{t('searchFilters.lost')}</SelectItem>
                                <SelectItem value="found">{t('searchFilters.found')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desktop-only flex group for remained filters to keep them tight */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-3 w-full sm:w-auto">
                        {/* Category Popover */}
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider font-bold opacity-50 ml-1">{t('searchFilters.category')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-xl bg-background/50 border-border/50 justify-between w-full sm:w-[150px] text-sm">
                                        <span className="truncate">
                                            {category.length === 0 ? t('searchFilters.allCategories') :
                                                category.length === 1 ? category[0] :
                                                    `${category.length} ${t('searchFilters.selected')}`}
                                        </span>
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
                        <div className="space-y-1 col-span-1">
                            <Label className="text-[10px] uppercase tracking-wider font-bold opacity-50 ml-1">{t('searchFilters.dateRange')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "h-10 rounded-xl bg-background/50 border-border/50 justify-start text-left font-normal w-full sm:w-[160px] text-sm",
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
                        <div className="space-y-1 col-span-2 sm:col-span-1 sm:w-[130px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold opacity-50 ml-1">{t('searchFilters.sortBy')}</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/50 text-sm">
                                    <SelectValue placeholder={t('searchFilters.newest')} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50">
                                    <SelectItem value="newest">{t('searchFilters.newest')}</SelectItem>
                                    <SelectItem value="oldest">{t('searchFilters.oldest')}</SelectItem>
                                    <SelectItem value="relevant">{t('searchFilters.mostRelevant')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                        <Button className="flex-1 sm:flex-none h-11 sm:h-10 rounded-xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm" onClick={handleSearch}>
                            {t('searchFilters.apply')}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-muted-foreground hover:bg-muted shrink-0" onClick={clearFilters} title={t('searchFilters.clearAll')}>
                            <X className="h-4 w-4" />
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
