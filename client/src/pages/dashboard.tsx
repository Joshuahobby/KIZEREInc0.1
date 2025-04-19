import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OwnershipTransferDialog } from "@/components/ui/ownership-transfer-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, ClipboardList, AlertTriangle, CheckCircle2, Bell, Calendar, 
  Tag, MapPin, PlusCircle, Search, ArrowUpRight, BarChart3, Activity,
  Clock, Users, Settings, ChevronDown, Filter, RefreshCw, X, Eye, Pencil,
  ChevronRight, MessageSquare, LineChart, TrendingUp, TrendingDown, Percent, 
  User, Shield, PieChart, Check
} from "lucide-react";
import { Item, Notification, UserRole } from "@shared/schema";
import { format, subDays } from "date-fns";
import { useState } from "react";

// Component for the Quick Actions panel
const QuickActionsPanel = () => {
  return (
    <Card className="bg-gradient-to-br from-[#00BFFF]/5 to-[#FFDD00]/5 border-[#00BFFF]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <PlusCircle className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#00BFFF] to-[#0099CC] hover:from-[#33CCFF] hover:to-[#00BFFF] text-white"
            onClick={() => window.location.href = '/register-item'}
          >
            <ClipboardList className="h-5 w-5 mb-1" />
            <span>Register Item</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#FF4D4D] to-[#CC0000] hover:from-[#FF6666] hover:to-[#FF4D4D] text-white"
            onClick={() => window.location.href = '/lost-found/report?type=lost'}
          >
            <AlertTriangle className="h-5 w-5 mb-1" />
            <span>Report Lost</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] hover:from-[#66BB6A] hover:to-[#4CAF50] text-white"
            onClick={() => window.location.href = '/lost-found/report?type=found'}
          >
            <CheckCircle2 className="h-5 w-5 mb-1" />
            <span>Report Found</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] hover:from-[#BA68C8] hover:to-[#9C27B0] text-white"
            onClick={() => window.location.href = '/search'}
          >
            <Search className="h-5 w-5 mb-1" />
            <span>Search Items</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Stats Card Component with trend indicators
interface StatsCardProps {
  title: string;
  value: number | undefined;
  previousValue?: number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  linkHref: string;
  isLoading: boolean;
  delay?: number;
}

const StatsCard = ({ 
  title, 
  value = 0, 
  previousValue, 
  icon, 
  iconBgClass, 
  iconTextClass, 
  linkHref, 
  isLoading,
  delay = 0 
}: StatsCardProps) => {
  const calculateTrend = () => {
    if (previousValue === undefined || value === undefined) return null;
    if (previousValue === 0) return { percent: 100, isUp: true };
    
    const diff = value - previousValue;
    const percent = Math.round((diff / previousValue) * 100);
    return { percent: Math.abs(percent), isUp: diff >= 0 };
  };

  const trend = calculateTrend();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${iconBgClass} rounded-md p-3`}>
                {icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
                  <dd className="flex items-baseline">
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-lg font-semibold text-foreground">{value}</div>
                    )}
                    
                    {trend && !isLoading && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`ml-2 flex items-center text-xs font-medium ${
                              trend.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {trend.isUp ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {trend.percent}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{trend.isUp ? 'Increased' : 'Decreased'} {trend.percent}% from previous period</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 px-4 py-3 sm:px-6 border-t border-border/50">
            <div className="text-sm">
              <Link href={linkHref}>
                <a className="font-medium text-primary hover:underline flex items-center">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Activity type definition
interface Activity {
  id: number;
  type: 'register' | 'status' | 'notification' | string;
  title: string;
  timestamp: Date;
  details: string;
}

// Recent Activity Timeline component
const ActivityTimeline = ({ activities = [] }: { activities: Activity[] }) => {
  // Mock activities for demonstration
  const mockActivities: Activity[] = [
    {
      id: 1,
      type: 'register',
      title: 'Laptop registered',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      details: 'MacBook Pro 16"'
    },
    {
      id: 2,
      type: 'status',
      title: 'Item marked as lost',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      details: 'Smartphone - iPhone 13 Pro'
    },
    {
      id: 3,
      type: 'notification',
      title: 'Match found for your lost item',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      details: 'Wireless Headphones'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'register':
        return <ClipboardList className="h-5 w-5 text-[#00BFFF]" />;
      case 'status':
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
      case 'notification':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <Activity className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#00BFFF]/30" aria-hidden="true"></div>
          <ul className="space-y-4">
            {mockActivities.map((activity) => (
              <motion.li 
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="relative pl-9"
              >
                <div className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#00BFFF]/20 bg-white dark:bg-gray-900">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 sm:mt-0">
                    {format(activity.timestamp, 'MMM d, h:mm a')}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-center">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          View All Activity
        </Button>
      </CardFooter>
    </Card>
  );
};

// Enhanced items table component
const ItemsDataTable = ({ 
  items = [], 
  isLoading = false 
}: { 
  items: Item[];
  isLoading: boolean;
}) => {
  const [sortBy, setSortBy] = useState('registered');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Filtered and sorted items
  const filteredItems = items.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-display flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Registered Items
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Found">Found</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Date Registered</SelectItem>
                <SelectItem value="name">Item Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          item.status === 'Registered' ? 'bg-primary/80' : 
                          item.status === 'Lost' ? 'bg-destructive' : 'bg-green-500'
                        }>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(item.registeredAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/items/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/items/${item.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          // To be implemented: ownership transfer dialog
                          console.log(`Transfer ownership for item ${item.id}: ${item.name}`);
                        }}>
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-6 mb-4 dark:bg-blue-900/20">
              <ClipboardList className="h-10 w-10 text-[#00BFFF]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No items registered</h3>
            <p className="text-muted-foreground mt-2 mb-6">Get started by registering your first item.</p>
            <Button
              onClick={() => window.location.href = '/register-item'}
              className="bg-gradient-to-r from-[#00BFFF] to-[#0099CC] hover:from-[#33CCFF] hover:to-[#00BFFF] text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Register New Item
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Notification type interface
interface NotificationType {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

// Enhanced notification center component
const NotificationCenter = ({ 
  notifications = [], 
  isLoading = false 
}: { 
  notifications: NotificationType[]; 
  isLoading: boolean 
}) => {
  const [filter, setFilter] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'update':
        return <RefreshCw className="h-4 w-4 text-amber-500" />;
      case 'match':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  // Mock notifications for demonstration
  const mockNotifications = [
    {
      id: 1,
      title: 'Item match found',
      message: 'A potential match has been found for your lost smartphone.',
      type: 'match',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      id: 2,
      title: 'Registration reminder',
      message: 'Reminder to complete the registration of your other items for better protection.',
      type: 'update',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
      id: 3,
      title: 'Security alert',
      message: 'Unusual access attempt detected on your account.',
      type: 'alert',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;
  const filteredNotifications = filter === 'all' 
    ? displayNotifications 
    : filter === 'unread'
    ? displayNotifications.filter(n => !n.isRead)
    : displayNotifications.filter(n => n.type === filter);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-display flex items-center">
            <Bell className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Notifications
          </CardTitle>
          <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="match">Matches</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg border ${
                  !notification.isRead 
                    ? 'bg-[#00BFFF]/5 border-[#00BFFF]/20' 
                    : 'bg-card border-border/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{notification.title}</h4>
                      <div className="flex items-center">
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-[#00BFFF] mr-2"></div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-6 mb-4 dark:bg-blue-900/20">
              <Bell className="h-10 w-10 text-[#00BFFF]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
            <p className="text-muted-foreground mt-2">You're all caught up!</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
        <Button variant="outline" size="sm">
          Notification settings
        </Button>
      </CardFooter>
    </Card>
  );
};

// Agent-specific components
const MatchingSuggestions = () => {
  // Mock matches for demonstration
  const mockMatches = [
    {
      id: 1,
      lostItem: {
        id: 101,
        name: 'MacBook Pro 16"',
        category: 'Electronics',
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        ownerName: 'John Doe'
      },
      foundItem: {
        id: 201,
        name: 'MacBook Pro',
        category: 'Electronics',
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        finderName: 'Alice Smith',
        location: 'Downtown Library'
      },
      matchScore: 92
    },
    {
      id: 2,
      lostItem: {
        id: 102,
        name: 'Blue leather wallet',
        category: 'Personal Items',
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        ownerName: 'David Johnson'
      },
      foundItem: {
        id: 202,
        name: 'Leather wallet',
        category: 'Personal Items',
        reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
        finderName: 'Michael Brown',
        location: 'City Park'
      },
      matchScore: 85
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <ArrowUpRight className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Potential Matches
        </CardTitle>
        <CardDescription>
          Items that may match reported lost items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockMatches.map((match) => (
            <div key={match.id} className="border rounded-lg p-4 bg-[#00BFFF]/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">Match Confidence</div>
                  <div className="flex items-center mt-1">
                    <div className="relative w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00BFFF] to-[#FFDD00]"
                        style={{ width: `${match.matchScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-semibold">{match.matchScore}%</span>
                  </div>
                </div>
                <Badge className="bg-[#00BFFF] hover:bg-[#33CCFF]">
                  New Match
                </Badge>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    Lost Item
                  </div>
                  <div className="text-sm font-semibold">{match.lostItem.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Reported by {match.lostItem.ownerName} • {match.lostItem.category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(match.lostItem.reportedAt, 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                    Found Item
                  </div>
                  <div className="text-sm font-semibold">{match.foundItem.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Found by {match.foundItem.finderName} • {match.foundItem.location}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(match.foundItem.reportedAt, 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Decline
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-[#00BFFF] to-[#0099CC]">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Connect Parties
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" size="sm" className="w-full">
          View All Potential Matches
        </Button>
      </CardFooter>
    </Card>
  );
};

// Admin-specific components
const AdminStats = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-[#00BFFF]" />
          System Stats
        </CardTitle>
        <CardDescription>
          Platform performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#00BFFF]/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Total Users</div>
            <div className="text-2xl font-bold text-foreground mt-1">1,285</div>
            <div className="flex items-center mt-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              12.5% this month
            </div>
          </div>
          
          <div className="p-3 bg-[#00BFFF]/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold text-foreground mt-1">78.4%</div>
            <div className="flex items-center mt-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              3.2% this month
            </div>
          </div>
          
          <div className="p-3 bg-[#00BFFF]/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Active Items</div>
            <div className="text-2xl font-bold text-foreground mt-1">3,672</div>
            <div className="flex items-center mt-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              8.7% this month
            </div>
          </div>
          
          <div className="p-3 bg-[#00BFFF]/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Resolution Time</div>
            <div className="text-2xl font-bold text-foreground mt-1">3.2d</div>
            <div className="flex items-center mt-1 text-xs text-red-500">
              <TrendingDown className="h-3 w-3 mr-1" />
              0.5d increase
            </div>
          </div>
        </div>
        
        <div className="mt-6 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium">User Distribution</h4>
            <Select defaultValue="week">
              <SelectTrigger className="w-[100px] h-7">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-center py-6">
            <div className="flex space-x-10">
              <div className="text-center">
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-[#00BFFF]/10">
                  <div className="absolute inset-0 rounded-full border-8 border-t-[#00BFFF] border-r-transparent border-b-transparent border-l-transparent"></div>
                  <div className="text-xl font-bold">65%</div>
                </div>
                <div className="mt-2 text-sm font-medium">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-[#FFDD00]/10">
                  <div className="absolute inset-0 rounded-full border-8 border-t-[#FFDD00] border-r-[#FFDD00] border-b-transparent border-l-transparent"></div>
                  <div className="text-xl font-bold">25%</div>
                </div>
                <div className="mt-2 text-sm font-medium">Agents</div>
              </div>
              <div className="text-center">
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-green-100">
                  <div className="absolute inset-0 rounded-full border-8 border-green-500 border-r-green-500 border-b-green-500 border-l-transparent"></div>
                  <div className="text-xl font-bold">10%</div>
                </div>
                <div className="mt-2 text-sm font-medium">Admins</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/analytics">
            <PieChart className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const UserManagementPanel = () => {
  // Mock users for demonstration
  const recentUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      role: "Subscriber",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      email: "m.rodriguez@example.com",
      role: "Agent",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
    },
    {
      id: 3,
      name: "Emma Williams",
      email: "emma.w@example.com",
      role: "Subscriber",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-display flex items-center">
            <User className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Recent Users
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/user-management">
              Manage Users
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.role === 'Admin' ? 'default' : 
                      user.role === 'Agent' ? 'outline' : 'secondary'
                    }>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(user.createdAt, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Account Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard settings interface
interface DashboardSettings {
  showQuickActions: boolean;
  showStats: boolean;
  showActivity: boolean;
  compactView: boolean;
  showTrends: boolean;
  autoRefresh: boolean;
  showNotifications: boolean;
}

// Dashboard customization panel
const DashboardCustomizationPanel = ({ 
  settings, 
  onSettingsChange 
}: { 
  settings: DashboardSettings; 
  onSettingsChange: (settings: DashboardSettings) => void 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6 border-[#00BFFF]/30 bg-primary-foreground/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Dashboard Preferences
          </CardTitle>
          <CardDescription>
            Customize your dashboard to show the information that matters most to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Layout</h4>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.showQuickActions}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showQuickActions: e.target.checked
                    })}
                  />
                  <span>Show Quick Actions</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.showStats}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showStats: e.target.checked
                    })}
                  />
                  <span>Show Statistics</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.showActivity}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showActivity: e.target.checked
                    })}
                  />
                  <span>Show Activity Timeline</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Data Display</h4>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.compactView}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      compactView: e.target.checked
                    })}
                  />
                  <span>Use Compact View</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.showTrends}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showTrends: e.target.checked
                    })}
                  />
                  <span>Show Trend Indicators</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Notification Preferences</h4>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.autoRefresh}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      autoRefresh: e.target.checked
                    })}
                  />
                  <span>Auto-refresh Dashboard</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary"
                    checked={settings.showNotifications}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      showNotifications: e.target.checked
                    })}
                  />
                  <span>Show Notifications</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 justify-between">
          <Button variant="outline" size="sm" onClick={() => onSettingsChange({
            showQuickActions: true,
            showStats: true,
            showActivity: true,
            compactView: false,
            showTrends: true,
            autoRefresh: true,
            showNotifications: true,
          })}>
            Reset to Default
          </Button>
          <Button size="sm" className="bg-primary">
            <Check className="h-4 w-4 mr-1" />
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Define dashboard stats interface
interface DashboardStats {
  registeredItems: number;
  lostItems: number;
  foundItems: number;
  notifications: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    showQuickActions: true,
    showStats: true,
    showActivity: true,
    compactView: false,
    showTrends: true,
    autoRefresh: true,
    showNotifications: true,
  });

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  // Fetch user items
  const { data: items, isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Fetch notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  if (!user) return null;

  // Mock previous stats for trend indicators
  const previousStats = {
    registeredItems: stats?.registeredItems ? Math.max(0, stats.registeredItems - 2) : 0,
    lostItems: stats?.lostItems ? Math.max(0, stats.lostItems - 1) : 0,
    foundItems: stats?.foundItems ? Math.max(0, stats.foundItems - 1) : 0,
    notifications: stats?.notifications ? Math.max(0, stats.notifications - 3) : 0
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground bg-gradient-to-r from-[#00BFFF] to-[#FFDD00] bg-clip-text text-transparent">
                  {user.role === 'Admin' ? 'Admin Dashboard' : 
                   user.role === 'Agent' ? 'Agent Dashboard' : 'User Dashboard'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Welcome back, {user.fullName || user.username}! {
                    user.role === 'Admin' 
                      ? 'Manage your platform and users.'
                      : user.role === 'Agent'
                      ? 'Manage lost and found items and help connect people.'
                      : 'Manage your registered items and reports.'
                  }
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-primary/20 hover:bg-primary/10"
                  onClick={() => setShowCustomizationPanel(!showCustomizationPanel)}
                  title="Customize Dashboard"
                >
                  <Settings className={`h-4 w-4 ${showCustomizationPanel ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
              </div>
            </div>
            
            {/* Customization Panel - toggleable */}
            <AnimatePresence>
              {showCustomizationPanel && (
                <DashboardCustomizationPanel 
                  settings={dashboardSettings} 
                  onSettingsChange={setDashboardSettings} 
                />
              )}
            </AnimatePresence>
            
            {/* Welcome Banner (today's date and welcome message) */}
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/5 border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-4 md:p-6 flex items-center">
                    <Calendar className="h-10 w-10 text-primary mr-4" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Today's Date</h3>
                      <p className="text-lg font-semibold">{format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 flex items-center md:col-span-2">
                    <Activity className="h-10 w-10 text-primary mr-4" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                      <p className="text-lg font-semibold flex items-center">
                        <Shield className="h-4 w-4 text-green-500 mr-2" />
                        Your account is active with <span className="text-primary font-bold px-1">{user.role}</span> privileges
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Panel - visible to all users if enabled in settings */}
            {dashboardSettings.showQuickActions && (
              <QuickActionsPanel />
            )}
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              <StatsCard 
                title="Registered Items"
                value={stats?.registeredItems || 0}
                previousValue={previousStats.registeredItems}
                icon={<ClipboardList className="h-6 w-6 text-primary" />}
                iconBgClass="bg-primary/10"
                iconTextClass="text-primary"
                linkHref="/register-item"
                isLoading={isLoadingStats}
                delay={0}
              />
              
              <StatsCard 
                title="Lost Items"
                value={stats?.lostItems || 0}
                previousValue={previousStats.lostItems}
                icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                iconBgClass="bg-red-100 dark:bg-red-900/30"
                iconTextClass="text-red-600 dark:text-red-400"
                linkHref="/lost-found?type=lost"
                isLoading={isLoadingStats}
                delay={0.1}
              />
              
              <StatsCard 
                title="Found Items"
                value={stats?.foundItems || 0}
                previousValue={previousStats.foundItems}
                icon={<CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
                iconTextClass="text-green-600 dark:text-green-400"
                linkHref="/lost-found?type=found"
                isLoading={isLoadingStats}
                delay={0.2}
              />
              
              <StatsCard 
                title="Notifications"
                value={stats?.notifications || 0}
                previousValue={previousStats.notifications}
                icon={<Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                iconTextClass="text-amber-600 dark:text-amber-400"
                linkHref="#notifications"
                isLoading={isLoadingStats}
                delay={0.3}
              />
            </div>
            
            {/* Role-specific content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Admin View */}
              {user.role === 'Admin' && (
                <>
                  <div className="lg:col-span-2">
                    <AdminStats />
                  </div>
                  <div>
                    <UserManagementPanel />
                  </div>
                  <div className="lg:col-span-3">
                    <ItemsDataTable items={items || []} isLoading={isLoadingItems} />
                  </div>
                </>
              )}
              
              {/* Agent View */}
              {user.role === 'Agent' && (
                <>
                  <div className="lg:col-span-2">
                    <MatchingSuggestions />
                  </div>
                  <div>
                    <ActivityTimeline activities={[]} />
                  </div>
                  <div className="lg:col-span-3">
                    <ItemsDataTable items={items || []} isLoading={isLoadingItems} />
                  </div>
                </>
              )}
              
              {/* Subscriber View */}
              {user.role === 'Subscriber' && (
                <>
                  <div className="lg:col-span-2">
                    <ItemsDataTable items={items || []} isLoading={isLoadingItems} />
                  </div>
                  <div>
                    <ActivityTimeline activities={[]} />
                  </div>
                </>
              )}
              
              {/* Notification Center - visible to all roles */}
              <div className="lg:col-span-3" id="notifications">
                <NotificationCenter notifications={notifications || []} isLoading={isLoadingNotifications} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}