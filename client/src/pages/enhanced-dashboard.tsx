import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { UserRole } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Bell,
  User,
  Settings,
  Calendar,
  PieChart,
  Activity,
  RefreshCw
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { ItemsTable } from "@/components/dashboard/items-table";
import { PersonalizationSettings } from "@/components/dashboard/personalization-settings";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { motion } from "framer-motion";

// Define activity types for demo - in production, this would come from your API
const mockActivities = [
  { 
    id: 1, 
    type: 'register', 
    title: 'Item Registered', 
    timestamp: new Date(Date.now() - 1000 * 60 * 30), 
    details: 'You registered a new laptop in the system.',
    category: 'Electronics'
  },
  { 
    id: 2, 
    type: 'lost', 
    title: 'Item Reported Lost', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), 
    details: 'Your wallet was reported as lost. Agents have been notified.',
    category: 'Accessories'
  },
  { 
    id: 3, 
    type: 'notification', 
    title: 'Potential Match Found', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), 
    details: 'A found item matching your lost wallet has been reported.',
    category: 'Matches'
  },
  { 
    id: 4, 
    type: 'update', 
    title: 'Item Information Updated', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28), 
    details: 'You updated the description of your smartphone.',
    category: 'Electronics'
  },
  { 
    id: 5, 
    type: 'found', 
    title: 'Item Recovered', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), 
    details: 'Your keys have been found and marked as recovered.',
    category: 'Accessories'
  }
];

// User preferences with defaults
const defaultPreferences = {
  layout: "default",
  theme: "system",
  showStats: true,
  showActivity: true,
  showNotifications: true,
  showItems: true,
  notificationAlerts: true,
  emailNotifications: false
};

/**
 * Enhanced Dashboard Page
 * 
 * A comprehensive, feature-rich dashboard with personalization options,
 * visual data representations, and interactive components.
 */
export default function EnhancedDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [statsPeriod, setStatsPeriod] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  
  const userRole: UserRole = user?.role as UserRole || "Subscriber";
  
  // Fetch dashboard data
  const { 
    stats, 
    isLoadingStats, 
    items, 
    isLoadingItems, 
    notifications, 
    isLoadingNotifications,
    previousStats
  } = useDashboardData(userRole);
  
  // Sample trend data for mock visualization
  // This would typically come from your API in a real implementation
  const registeredTrendData = [20, 22, 25, 30, 28, 32, 35];
  const lostTrendData = [8, 10, 7, 12, 10, 8, 5];
  const foundTrendData = [5, 6, 8, 7, 9, 10, 12];
  
  // Calculate success rate (found items / lost items)
  const successRate = stats?.lostItems ? 
    Math.round((stats.foundItems / stats.lostItems) * 100) : 0;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="mb-3 md:mb-0">
                <h1 className="text-2xl font-display font-semibold text-neutral-900 flex items-center">
                  <User className="h-6 w-6 mr-2 text-[#00BFFF]" />
                  {user?.fullName || "User"}'s Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your items, check notifications, and track activities
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                  <SelectTrigger className="h-9 w-[100px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Personalize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <PersonalizationSettings 
                      preferences={preferences}
                      isLoading={false}
                      onClose={() => setShowSettingsDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
                
                <ThemeToggle />
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="overview" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  My Items
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <TabsContent value="overview" className="m-0">
              {/* Quick Actions Panel */}
              <div className="mb-6">
                <QuickActionsPanel />
              </div>
              
              {/* Stats Cards Row */}
              {preferences.showStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatsCard
                    title="Total Registered Items"
                    value={stats?.registeredItems}
                    previousValue={previousStats?.registeredItems}
                    icon={<ClipboardList className="h-5 w-5 text-blue-50" />}
                    iconBgClass="bg-gradient-to-br from-blue-500 to-[#00BFFF]"
                    iconTextClass="text-blue-50"
                    linkHref="/items"
                    isLoading={isLoadingStats}
                    trendData={registeredTrendData}
                    chartColor="#00BFFF"
                    delay={0}
                  />
                  
                  <StatsCard
                    title="Lost Items"
                    value={stats?.lostItems}
                    previousValue={previousStats?.lostItems}
                    icon={<AlertTriangle className="h-5 w-5 text-red-50" />}
                    iconBgClass="bg-gradient-to-br from-red-500 to-red-600"
                    iconTextClass="text-red-50"
                    linkHref="/lost-found"
                    isLoading={isLoadingStats}
                    trendData={lostTrendData}
                    chartColor="#EF4444"
                    delay={0.1}
                  />
                  
                  <StatsCard
                    title="Found Items"
                    value={stats?.foundItems}
                    previousValue={previousStats?.foundItems}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-50" />}
                    iconBgClass="bg-gradient-to-br from-green-500 to-green-600"
                    iconTextClass="text-green-50"
                    linkHref="/lost-found"
                    isLoading={isLoadingStats}
                    trendData={foundTrendData}
                    chartColor="#10B981"
                    successRate={successRate}
                    delay={0.2}
                  />
                  
                  <StatsCard
                    title="Notifications"
                    value={stats?.notifications}
                    previousValue={previousStats?.notifications}
                    icon={<Bell className="h-5 w-5 text-amber-50" />}
                    iconBgClass="bg-gradient-to-br from-amber-500 to-amber-600"
                    iconTextClass="text-amber-50"
                    linkHref="/notifications"
                    isLoading={isLoadingStats}
                    delay={0.3}
                  />
                </div>
              )}
              
              {/* Activity and Notifications Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {preferences.showActivity && (
                  <ActivityTimeline 
                    activities={mockActivities}
                    isLoading={false}
                  />
                )}
                
                {preferences.showNotifications && (
                  <NotificationCenter 
                    notifications={notifications || []}
                    isLoading={isLoadingNotifications}
                  />
                )}
              </div>
              
              {/* Items Table */}
              {preferences.showItems && (
                <div className="mb-6">
                  <ItemsTable 
                    items={items || []}
                    isLoading={isLoadingItems}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="items" className="m-0">
              <ItemsTable 
                items={items || []}
                isLoading={isLoadingItems}
              />
            </TabsContent>
            
            <TabsContent value="activity" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActivityTimeline 
                  activities={mockActivities}
                  isLoading={false}
                />
                
                <NotificationCenter 
                  notifications={notifications || []}
                  isLoading={isLoadingNotifications}
                />
              </div>
            </TabsContent>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}