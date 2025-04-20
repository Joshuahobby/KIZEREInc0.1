import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Item } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  PenSquare, 
  Trash2,
  Tag,
  MapPin,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  CheckIcon,
  AlertTriangleIcon,
  Search as SearchIcon
} from "lucide-react";

interface ItemsTableProps {
  items: Item[];
  isLoading: boolean;
}

/**
 * Enhanced Items Table Component
 * 
 * Displays registered items in a data table with sorting and filtering options,
 * and supports inline editing of item information.
 */
export const ItemsTable = ({ 
  items = [], 
  isLoading = false 
}: ItemsTableProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("registered");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Update item status mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/items/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch items
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    }
  });
  
  // Filter items based on search term and status filter
  const filteredItems = items.filter(item => {
    // Apply status filter
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.uniqueIdentifier?.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case "registered":
        valueA = new Date(a.registeredAt).getTime();
        valueB = new Date(b.registeredAt).getTime();
        break;
      case "name":
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case "category":
        valueA = a.category.toLowerCase();
        valueB = b.category.toLowerCase();
        break;
      default:
        valueA = new Date(a.registeredAt).getTime();
        valueB = new Date(b.registeredAt).getTime();
    }
    
    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
  
  // Handle sort column change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection("desc");
    }
  };
  
  // Generate status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Registered":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Registered</Badge>;
      case "Lost":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Lost</Badge>;
      case "Found":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Found</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (id: number, status: string) => {
    updateItemMutation.mutate({ id, status });
  };
  
  // View item details
  const handleViewDetails = (item: Item) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };
  
  // Generate category icon
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case "electronics":
        return <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>;
      case "documents":
        return <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>;
      case "jewelry":
        return <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>;
      case "accessories":
        return <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-600 dark:text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Tag className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>;
    }
  };
  
  // Loading skeletons
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-display flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-[#00BFFF]" />
            My Registered Items
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[180px] sm:w-[220px] pl-8 h-9"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Found">Found</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Date Registered</SelectItem>
                <SelectItem value="name">Item Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort Direction Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""} transition-transform`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Registered</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                renderSkeletons()
              ) : sortedItems.length > 0 ? (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {getCategoryIcon(item.category)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.registeredAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PenSquare className="h-4 w-4 mr-2" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          {item.status !== "Registered" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, "Registered")}>
                              <CheckIcon className="h-4 w-4 mr-2 text-blue-500" />
                              Mark as Registered
                            </DropdownMenuItem>
                          )}
                          {item.status !== "Lost" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, "Lost")}>
                              <AlertTriangleIcon className="h-4 w-4 mr-2 text-red-500" />
                              Report as Lost
                            </DropdownMenuItem>
                          )}
                          {item.status !== "Found" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, "Found")}>
                              <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                              Mark as Found
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchTerm || statusFilter !== "all" ? (
                      <div className="flex flex-col items-center justify-center">
                        <SearchIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No matching items found.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                          }}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No items have been registered yet.</p>
                        <Button variant="link" className="mt-2">
                          Register your first item
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Item Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
              <DialogDescription>
                View detailed information about your registered item.
              </DialogDescription>
            </DialogHeader>
            
            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center">
                  {getCategoryIcon(selectedItem.category)}
                  <div className="ml-3">
                    <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {selectedItem.id}</p>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p>{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Identifier</p>
                    <p>{selectedItem.uniqueIdentifier || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registered Date</p>
                    <p>{format(new Date(selectedItem.registeredAt), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p>{format(new Date(selectedItem.updatedAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedItem.description || "No description provided."}</p>
                </div>
                
                {selectedItem.location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Known Location</p>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{selectedItem.location}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
              <Button>Edit Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};