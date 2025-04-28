import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  CardHeader,
  CardFooter 
} from "@/components/ui/card";
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
import { Calendar as CalendarIcon, X, Filter, Download } from "lucide-react";

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
    role: "",
    status: "",
    verificationStatus: "",
    activityLevel: "",
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
      role: "",
      status: "",
      verificationStatus: "",
      activityLevel: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    
    setFilters(defaultFilters);
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange(defaultFilters);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>User Filters</CardTitle>
        <CardDescription>Filter and sort the user list</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, email, ID..."
              value={filters.search}
              onChange={(e) => handleChange("search", e.target.value)}
            />
          </div>
          
          {/* User Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) => handleChange("role", value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Subscriber">Subscriber</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* User Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Verification Status */}
          <div className="space-y-2">
            <Label htmlFor="verificationStatus">Verification</Label>
            <Select
              value={filters.verificationStatus}
              onValueChange={(value) => handleChange("verificationStatus", value)}
            >
              <SelectTrigger id="verificationStatus">
                <SelectValue placeholder="Any verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Activity Level */}
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Activity</Label>
            <Select
              value={filters.activityLevel}
              onValueChange={(value) => handleChange("activityLevel", value)}
            >
              <SelectTrigger id="activityLevel">
                <SelectValue placeholder="Any activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any activity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
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
          
          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
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
          
          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleChange("sortBy", value)}
            >
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Registration Date</SelectItem>
                <SelectItem value="lastLogin">Last Login</SelectItem>
                <SelectItem value="fullName">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="warningCount">Warning Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value: "asc" | "desc") => handleChange("sortOrder", value)}
            >
              <SelectTrigger id="sortOrder">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="secondary">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid gap-2">
                <Button variant="ghost" onClick={() => onExport('csv')}>Export as CSV</Button>
                <Button variant="ghost" onClick={() => onExport('excel')}>Export as Excel</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardFooter>
    </Card>
  );
}