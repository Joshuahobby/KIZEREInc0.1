import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, X, Filter, Download, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserFiltersProps {
  onFilterChange: (filters: UserFilters) => void;
  onExport: (format: 'csv' | 'excel') => void;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  verificationStatus: string;
  activityLevel: string;
  startDate?: Date;
  endDate?: Date;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function UserFilters({ onFilterChange, onExport }: UserFiltersProps) {
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "_all_roles",
    status: "_all_statuses",
    verificationStatus: "_all_verification",
    activityLevel: "_all_activity",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const handleChange = (key: keyof UserFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Handle date changes separately
    if (key === 'startDate') {
      setStartDate(value);
      newFilters.startDate = value;
    } else if (key === 'endDate') {
      setEndDate(value);
      newFilters.endDate = value;
    }
    
    onFilterChange(newFilters);
  };
  
  const clearFilters = () => {
    const defaultFilters: UserFilters = {
      search: "",
      role: "_all_roles",
      status: "_all_statuses",
      verificationStatus: "_all_verification",
      activityLevel: "_all_activity",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    
    setFilters(defaultFilters);
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.role !== "_all_roles",
    filters.status !== "_all_statuses",
    filters.verificationStatus !== "_all_verification",
    filters.activityLevel !== "_all_activity",
    startDate !== undefined,
    endDate !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      {/* Primary Search Bar */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl border-2 border-primary/5 bg-background/50 backdrop-blur-sm transition-all focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          placeholder="Search for users by name, email, or ID..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="h-12 border-none bg-transparent pl-11 pr-4 focus-visible:ring-0"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Advanced Filters Trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-12 border-2 px-4 transition-all hover:bg-muted relative",
                activeFiltersCount > 0 ? "border-primary/20 bg-primary/5 text-primary" : "border-primary/5"
              )}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-6 shadow-2xl rounded-2xl border-primary/10 bg-background/95 backdrop-blur-md" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-primary/5 pb-4">
                <h4 className="font-bold leading-none tracking-tight">Advanced Filters</h4>
                <Button variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-primary" onClick={clearFilters}>
                  Reset All
                </Button>
              </div>

              <div className="grid gap-4">
                {/* User Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Role</Label>
                  <Select value={filters.role} onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger id="role" className="h-10 border-primary/10 bg-muted/30">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all_roles">All roles</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Subscriber">Subscriber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Status</Label>
                  <Select value={filters.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger id="status" className="h-10 border-primary/10 bg-muted/30">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all_statuses">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date From */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-10 w-full justify-start text-left font-normal border-primary/10 bg-muted/30 px-3",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          <span className="truncate">{startDate ? format(startDate, "MMM d, yyyy") : "Date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => handleChange("startDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-10 w-full justify-start text-left font-normal border-primary/10 bg-muted/30 px-3",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          <span className="truncate">{endDate ? format(endDate, "MMM d, yyyy") : "Date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => handleChange("endDate", date)}
                          initialFocus
                          disabled={(date) => startDate ? date < startDate : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="pt-2 border-t border-primary/5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block text-center">Sorting & Display</Label>
                  <div className="flex gap-2">
                    <Select value={filters.sortBy} onValueChange={(value) => handleChange("sortBy", value)}>
                      <SelectTrigger className="h-10 border-primary/10 bg-muted/30 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Registration</SelectItem>
                        <SelectItem value="lastLogin">Last Login</SelectItem>
                        <SelectItem value="fullName">Full Name</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.sortOrder} onValueChange={(value: "asc" | "desc") => handleChange("sortOrder", value)}>
                      <SelectTrigger className="h-10 border-primary/10 bg-muted/30 w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
                variant="outline" 
                className="h-12 border-2 border-primary/5 px-4 transition-all hover:bg-muted"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2 shadow-xl border-primary/10 rounded-xl bg-background/95 backdrop-blur-md" align="end">
            <div className="grid gap-1">
              <Button variant="ghost" className="justify-start px-2 py-1.5 h-9 rounded-lg" onClick={() => onExport('csv')}>
                <Search className="mr-2 h-3.5 w-3.5" /> Export as CSV
              </Button>
              <Button variant="ghost" className="justify-start px-2 py-1.5 h-9 rounded-lg" onClick={() => onExport('excel')}>
                <Download className="mr-2 h-3.5 w-3.5" /> Export as Excel
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}