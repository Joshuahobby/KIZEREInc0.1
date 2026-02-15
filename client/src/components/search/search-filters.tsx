
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface SearchFiltersProps {
    onSearch: (filters: any) => void;
    initialFilters?: any;
}

export function SearchFilters({ onSearch, initialFilters }: SearchFiltersProps) {
    const [searchTerm, setSearchTerm] = useState(initialFilters?.q || "");
    const [type, setType] = useState(initialFilters?.type || "lost"); // Default to lost/found search
    const [status, setStatus] = useState<string[]>(initialFilters?.status ? initialFilters.status.split(',') : []);
    const [category, setCategory] = useState<string[]>(initialFilters?.category ? initialFilters.category.split(',') : []);
    const [location, setLocation] = useState(initialFilters?.location || "");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: initialFilters?.startDate ? new Date(initialFilters.startDate) : undefined,
        to: initialFilters?.endDate ? new Date(initialFilters.endDate) : undefined,
    });

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
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setType("all");
        setStatus([]);
        setCategory([]);
        setLocation("");
        setDateRange({ from: undefined, to: undefined });
        onSearch({});
    };

    const toggleStatus = (s: string) => {
        setStatus(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
    };

    const toggleCategory = (c: string) => {
        setCategory(prev => prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c]);
    };

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
