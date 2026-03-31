
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface SearchFiltersProps {
    onSearch: (filters: any) => void;
    initialFilters?: any;
    layout?: "vertical" | "horizontal";
    hideSearchInput?: boolean;
    viewModeAction?: React.ReactNode;
}

export function SearchFilters({ onSearch, initialFilters, layout = "vertical", hideSearchInput = false, viewModeAction }: SearchFiltersProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState(initialFilters?.q || "");
    const [type, setType] = useState(initialFilters?.type || "all"); // Default to all search
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
            setType(initialFilters.type || "all");
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
        "electronics", "documents", "jewelry", "clothing", "keys", "other"
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

    const isFirstRender = useRef(true);

    // Auto-apply filters when they change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        
        const timer = setTimeout(() => {
            handleSearch();
        }, 150); // slight debounce
        
        return () => clearTimeout(timer);
    }, [type, status, category, location, dateRange, sortBy]);

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
            <div className="w-full bg-background/50 backdrop-blur-xl border border-border/30 p-2 md:p-3 rounded-2xl md:rounded-3xl shadow-premium transition-all">
                <div className="flex flex-row items-center gap-3">
                    {/* Main Search */}
                    {!hideSearchInput && (
                        <div className="flex-1">
                            <div className="relative h-14 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary shrink-0" />
                                <Input
                                    placeholder={t('searchFilters.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="h-full pl-12 w-full bg-card/50 border-border/10 rounded-2xl shadow-sm focus:ring-primary/20 transition-all hover:bg-card/80 text-sm font-black tracking-tight"
                                />
                            </div>
                        </div>
                    )}

                    {/* Mobile Filter Trigger */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-card border-border/10 shadow-premium text-primary hover:text-white transition-all">
                                    <SlidersHorizontal className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[85vh] bg-background border-t-border/50 rounded-t-3xl px-6 py-8 outline-none">
                                <SheetHeader className="pb-8 text-left">
                                    <SheetTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                                        <Filter className="h-6 w-6 text-primary" />
                                        {t('searchFilters.filterTitle') || "Filter Results"}
                                    </SheetTitle>
                                </SheetHeader>
                                
                                <div className="space-y-8 overflow-y-auto max-h-full pb-28 custom-scrollbar">
                                    {/* Type */}
                                    <div className="space-y-3">
                                        <Label className="premium-label mb-2 block">{t('searchFilters.type') || "Report Type"}</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="h-14 bg-card/50 border-border/10 rounded-2xl text-base font-black px-5">
                                                <SelectValue placeholder={t('searchFilters.allTypes')} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border/30 rounded-2xl">
                                                <SelectItem value="all" className="font-bold">{t('searchFilters.allTypes')}</SelectItem>
                                                <SelectItem value="lost" className="font-bold">{t('searchFilters.lost')}</SelectItem>
                                                <SelectItem value="found" className="font-bold">{t('searchFilters.found')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Category Grid */}
                                    <div className="space-y-4">
                                        <Label className="premium-label mb-2 block">{t('searchFilters.categories') || "Item Categories"}</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map(c => (
                                                <div 
                                                    key={c} 
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer h-16",
                                                        category.includes(c) 
                                                            ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" 
                                                            : "bg-card/50 border-border/10 text-muted-foreground"
                                                    )}
                                                    onClick={() => toggleCategory(c)}
                                                >
                                                    <span className="text-sm font-black uppercase tracking-tight">{t(`item_category_${c}`)}</span>
                                                    <Checkbox
                                                        checked={category.includes(c)}
                                                        className="h-5 w-5 border-border/20 data-[state=checked]:bg-primary"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div className="space-y-3">
                                        <Label className="premium-label mb-2 block">{t('searchFilters.pickDate')}</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="h-14 w-full bg-card/50 border-border/10 rounded-2xl text-base font-black px-5 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-5 w-5 text-primary" />
                                                        <span>
                                                            {dateRange.from ? (
                                                                dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}` : format(dateRange.from, "LLL dd")
                                                            ) : t('searchFilters.pickDate')}
                                                        </span>
                                                    </div>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-background border-border/30 rounded-2xl" align="center">
                                                <Calendar
                                                    mode="range"
                                                    selected={dateRange}
                                                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                                    className="p-3 shadow-2xl"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Reset Button */}
                                    <Button variant="destructive" onClick={clearFilters} className="h-14 w-full rounded-2xl font-black uppercase tracking-widest mt-4">
                                        {t('searchFilters.clearAll') || "Reset All Filters"}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Desktop Filters (md+) */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Type */}
                        <div className="w-[140px]">
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-full bg-card/60 border-border/10 rounded-xl h-14 shadow-sm transition-all text-xs font-black uppercase tracking-widest px-4">
                                    <SelectValue placeholder={t('searchFilters.allTypes')} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/30 shadow-2xl backdrop-blur-xl bg-background/95">
                                    <SelectItem value="all" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.allTypes')}</SelectItem>
                                    <SelectItem value="lost" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.lost')}</SelectItem>
                                    <SelectItem value="found" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.found')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category Popover */}
                        <div className="w-[180px]">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full bg-card/60 border-border/10 rounded-xl h-14 shadow-sm transition-all text-xs font-black uppercase tracking-widest px-4 justify-between">
                                        <span className="truncate">
                                            {category.length === 0 ? t('searchFilters.allCategories') :
                                                category.length === 1 ? t(`item_category_${category[0]}`) :
                                                    `${category.length} ${t('searchFilters.selected')}`}
                                        </span>
                                        <Filter className="ml-1.5 h-3.5 w-3.5 opacity-50 shrink-0 text-primary" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-2 rounded-2xl border-border/30 shadow-2xl bg-background/95 backdrop-blur-xl" align="start">
                                    <div className="space-y-1">
                                        {categories.map(c => (
                                            <div key={c} className="flex items-center space-x-2 p-2.5 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors group" onClick={() => toggleCategory(c)}>
                                                <Checkbox
                                                    id={`cat-h-${c}`}
                                                    checked={category.includes(c)}
                                                    onCheckedChange={() => toggleCategory(c)}
                                                    className="rounded-md border-border/50 data-[state=checked]:bg-primary"
                                                />
                                                <label htmlFor={`cat-h-${c}`} className="text-xs font-black uppercase tracking-wide leading-none cursor-pointer group-hover:text-primary transition-colors">
                                                    {t(`item_category_${c}`)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Sort By */}
                        <div className="w-[140px]">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full bg-card/60 border-border/10 rounded-xl h-14 shadow-sm transition-all text-xs font-black uppercase tracking-widest px-4">
                                    <SelectValue placeholder={t('searchFilters.newest')} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/30 shadow-2xl backdrop-blur-xl bg-background/95">
                                    <SelectItem value="newest" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.newest')}</SelectItem>
                                    <SelectItem value="oldest" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.oldest')}</SelectItem>
                                    <SelectItem value="relevant" className="rounded-lg text-xs font-bold uppercase cursor-pointer">{t('searchFilters.mostRelevant')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {viewModeAction}
                            <Button variant="ghost" size="icon" className="h-14 w-14 flex items-center justify-center rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group shrink-0" onClick={clearFilters} title={t('searchFilters.clearAll')}>
                                <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" /> {t('searchFilters.filterTitle') || "Filters"}
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-neutral-500">
                    <X className="w-3 h-3 mr-1" /> {t('searchFilters.clear') || "Clear"}
                </Button>
            </div>

            {/* Main Search */}
            <div className="space-y-2">
                <Label>{t('searchFilters.searchTerm') || "Search Term"}</Label>
                <Input
                    placeholder={t('searchFilters.searchPlaceholder') || "Keyword, Serial Number..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Type */}
            <div className="space-y-2">
                <Label>{t('searchFilters.type') || "Type"}</Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('searchFilters.allTypes') || "All Types"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('searchFilters.all') || "All"}</SelectItem>
                        <SelectItem value="lost">{t('searchFilters.lost') || "Lost"}</SelectItem>
                        <SelectItem value="found">{t('searchFilters.found') || "Found"}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label>{t('searchFilters.location') || "Location"}</Label>
                <Input
                    placeholder={t('searchFilters.locationPlaceholder') || "City, District..."}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* Category (Multi-select simulation) */}
            <div className="space-y-2">
                <Label>{t('searchFilters.categories') || "Categories"}</Label>
                <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                        <div key={c} className="flex items-center space-x-2">
                            <Checkbox
                                id={`cat-${c}`}
                                checked={category.includes(c)}
                                onCheckedChange={() => toggleCategory(c)}
                            />
                            <label htmlFor={`cat-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t(`item_category_${c}`)}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
                <Label>{t('searchFilters.dateRange') || "Date Range"}</Label>
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
                                <span>{t('searchFilters.pickDate') || "Pick a date"}</span>
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
        </div>
    );
}
