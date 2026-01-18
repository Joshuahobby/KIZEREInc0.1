import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

// Locally define types until we fix imports
type ItemStatus = 'Registered' | 'Lost' | 'Found' | 'Recovered' | 'Archived';

interface Item {
  id: number;
  userId: number;
  name: string;
  category: string;
  uniqueIdentifier: string;
  description: string;
  status: ItemStatus;
  location: string;
  registeredAt: Date;
  updatedAt: Date;
  details: Record<string, any>;
  imageUrls: string[];
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, Search, Package, AlertTriangle, CheckCircle, X, Eye, 
  Edit, ArrowUpDown, Calendar, Tag, MapPin, ArrowRight, Loader2 
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { EmptyState, ItemSkeleton } from "@/components/ui";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Status badge variations based on item status
const getStatusBadgeVariant = (status: ItemStatus) => {
  switch (status) {
    case 'Registered':
      return 'outline';
    case 'Lost':
      return 'destructive';
    case 'Found':
      return 'success';
    case 'Recovered':
      return 'success';
    case 'Archived':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function MyItemsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState("all");
  
  // Fetch user's items
  const { data: items, isLoading, error } = useQuery({
    queryKey: ["/api/user/items", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Would normally fetch from the API
      return [
        // Example items for development - would be replaced with actual API data
        {
          id: 1,
          userId: user.id,
          name: "MacBook Pro",
          category: "Electronics",
          uniqueIdentifier: "FVFGH3857Q",
          description: "16-inch 2021 MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD",
          status: "Registered" as ItemStatus,
          location: "Home office",
          registeredAt: new Date("2025-03-15"),
          updatedAt: new Date("2025-03-15"),
          details: {},
          imageUrls: [
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2940&auto=format&fit=crop"
          ]
        },
        {
          id: 2,
          userId: user.id,
          name: "iPhone 14 Pro",
          category: "Phones",
          uniqueIdentifier: "IMEI353916108263857",
          description: "Midnight black iPhone 14 Pro with 256GB storage",
          status: "Lost" as ItemStatus,
          location: "Last seen at Central Park",
          registeredAt: new Date("2025-02-20"),
          updatedAt: new Date("2025-04-10"),
          details: {
            lostDate: "2025-04-10",
            lostLocation: "Central Park, New York"
          },
          imageUrls: [
            "https://images.unsplash.com/photo-1678911820864-e5f41b77ef47?q=80&w=2942&auto=format&fit=crop"
          ]
        },
        {
          id: 3,
          userId: user.id,
          name: "Sony WH-1000XM5",
          category: "Electronics",
          uniqueIdentifier: "SN9753214680",
          description: "Noise-cancelling headphones, silver color",
          status: "Recovered" as ItemStatus,
          location: "Bedroom",
          registeredAt: new Date("2025-01-05"),
          updatedAt: new Date("2025-04-15"),
          details: {
            recoveredDate: "2025-04-15"
          },
          imageUrls: [
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=2940&auto=format&fit=crop"
          ]
        }
      ] as Item[];
    },
    enabled: !!user?.id
  });
  
  // Filter items based on search, category, and status
  const filteredItems = items?.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uniqueIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    
    // Filter by tab
    if (currentTab === "all") return matchesSearch && matchesCategory && matchesStatus;
    if (currentTab === "registered") return item.status === "Registered" && matchesSearch && matchesCategory;
    if (currentTab === "lost") return item.status === "Lost" && matchesSearch && matchesCategory;
    if (currentTab === "recovered") return (item.status === "Recovered" || item.status === "Found") && matchesSearch && matchesCategory;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];
  
  // Get unique categories from items for the filter dropdown
  const uniqueCategories = items ? Array.from(new Set(items.map(item => item.category))) : [];
  
  const handleReportLost = (itemId: number) => {
    navigate(`/report-lost/${itemId}`);
  };
  
  const handleViewItem = (itemId: number) => {
    navigate(`/items/${itemId}`);
  };
  
  if (isLoading) {
    return (
      <PageLayout>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Items</h1>
              <p className="text-muted-foreground mt-1">Manage your registered possessions</p>
            </div>
            <div className="h-10 w-32">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-md h-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout>
        <div className="container max-w-6xl mx-auto py-8">
          <EmptyState 
            icon={<X className="h-10 w-10 text-red-500" />}
            title="Failed to load items"
            description="We couldn't load your registered items. Please try again later."
            action={
              <Button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600">
                Try Again
              </Button>
            }
            variant="error"
          />
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Items</h1>
            <p className="text-muted-foreground mt-1">Manage your registered possessions</p>
          </div>
          
          <Button
            onClick={() => navigate("/register-item")}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Register New Item
          </Button>
        </div>
        
        <div className="bg-muted/40 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, or identifier..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Found">Found</SelectItem>
                  <SelectItem value="Recovered">Recovered</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="relative">
              All
              <Badge className="ml-2 bg-sky-500">{items?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="registered" className="relative">
              Registered
              <Badge className="ml-2 bg-primary">{items?.filter(i => i.status === "Registered").length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="lost" className="relative">
              Lost
              <Badge className="ml-2 bg-destructive">{items?.filter(i => i.status === "Lost").length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recovered" className="relative">
              Recovered
              <Badge className="ml-2 bg-green-500">{items?.filter(i => i.status === "Recovered" || i.status === "Found").length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <ItemsGrid 
              items={filteredItems} 
              onReportLost={handleReportLost} 
              onViewItem={handleViewItem}
            />
          </TabsContent>
          
          <TabsContent value="registered" className="mt-0">
            <ItemsGrid 
              items={filteredItems} 
              onReportLost={handleReportLost} 
              onViewItem={handleViewItem}
            />
          </TabsContent>
          
          <TabsContent value="lost" className="mt-0">
            <ItemsGrid 
              items={filteredItems} 
              onReportLost={handleReportLost} 
              onViewItem={handleViewItem}
            />
          </TabsContent>
          
          <TabsContent value="recovered" className="mt-0">
            <ItemsGrid 
              items={filteredItems} 
              onReportLost={handleReportLost} 
              onViewItem={handleViewItem}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

interface ItemsGridProps {
  items: Item[];
  onReportLost: (itemId: number) => void;
  onViewItem: (itemId: number) => void;
}

function ItemsGrid({ items, onReportLost, onViewItem }: ItemsGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState 
        icon={<Package className="h-10 w-10 text-sky-500" />}
        title="No items found"
        description="You don't have any items matching your filters."
        action={
          <Button variant="outline" asChild className="border-sky-500 text-sky-500 hover:bg-sky-50 hover:text-sky-600">
            <Link href="/register-item">
              <PlusCircle className="mr-2 h-4 w-4" />
              Register New Item
            </Link>
          </Button>
        }
        variant="default"
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img 
                    src={item.imageUrls[0]} 
                    alt={item.name}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status badge floating on the image */}
                <Badge 
                  className="absolute top-2 right-2"
                  variant={getStatusBadgeVariant(item.status)}
                >
                  {item.status === 'Lost' && <AlertTriangle className="mr-1 h-3 w-3" />}
                  {item.status === 'Recovered' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {item.status}
                </Badge>
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl line-clamp-1">{item.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Tag className="h-4 w-4 mr-1" />
                  {item.category}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.description}
                </p>
                
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Registered: {new Date(item.registeredAt).toLocaleDateString()}</span>
                </div>
                
                {item.location && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{item.location}</span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onViewItem(item.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                {item.status === 'Registered' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1"
                    onClick={() => onReportLost(item.id)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Report Lost
                  </Button>
                )}
                
                {item.status === 'Lost' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Found
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}