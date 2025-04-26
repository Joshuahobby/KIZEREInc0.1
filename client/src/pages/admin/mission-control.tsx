import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Bell, 
  Users, 
  Package, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  CreditCard,
  ArrowUpRight,
  Eye,
  Filter
} from 'lucide-react';

// Import command center components
import { CommandBar } from '@/components/command-center/command-bar';
import { Workspace, WorkspacePanel } from '@/components/command-center/workspace';
import { ActivityTimeline, TimelineEvent } from '@/components/command-center/activity-timeline';
import { QuickActionMenu } from '@/components/command-center/quick-action-menu';

// Import existing data components
import { PaymentAnalyticsChart, PaymentStatusChart } from "@/components/dashboard/payment-analytics-chart-fixed";
import { UserRoleDistribution } from "@/components/dashboard/user-role-distribution";
import { ItemCategoryChart } from "@/components/dashboard/item-category-chart";
import { ContextualSidebar } from "@/components/dashboard/contextual-sidebar";

// Import shared UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Example data (in a real application, this would come from an API)
const MOCK_USER_ROLES_DATA = [
  { name: 'Subscribers', value: 120, color: '#3b82f6' },
  { name: 'Agents', value: 45, color: '#8b5cf6' },
  { name: 'Admins', value: 15, color: '#14b8a6' }
];

const MOCK_PAYMENT_STATUS_DATA = [
  { name: 'Success', value: 82, color: '#10b981' },
  { name: 'Pending', value: 12, color: '#f59e0b' },
  { name: 'Failed', value: 6, color: '#ef4444' }
];

const MOCK_PAYMENT_ANALYTICS_DATA = [
  { date: 'Jan', amount: 2400 },
  { date: 'Feb', amount: 1398 },
  { date: 'Mar', amount: 9800 },
  { date: 'Apr', amount: 3908 },
  { date: 'May', amount: 4800 },
  { date: 'Jun', amount: 3800 },
  { date: 'Jul', amount: 4300 }
];

const MOCK_ITEM_CATEGORIES_DATA = [
  { name: 'Electronics', value: 45 },
  { name: 'Jewelry', value: 28 },
  { name: 'Documents', value: 33 },
  { name: 'Phones', value: 22 },
  { name: 'Other', value: 12 }
];

const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    type: 'user',
    title: 'New User Registration',
    description: 'A new user has registered on the platform.',
    timestamp: '2025-04-26T10:30:00Z',
    date: 'Today',
    time: '10:30 AM',
    importance: 'medium',
    status: 'success',
    actor: {
      name: 'John Doe',
      role: 'Subscriber'
    },
    isExpandable: true,
    metadata: {
      email: 'john.doe@example.com',
      phoneNumber: '+1 (555) 123-4567',
      location: 'New York, NY'
    },
    actions: [
      {
        label: 'View Profile',
        icon: <Eye className="h-3 w-3" />,
        onClick: () => console.log('View profile')
      }
    ]
  },
  {
    id: '2',
    type: 'item',
    title: 'Item Registered',
    description: 'A new item has been registered in the system.',
    timestamp: '2025-04-26T09:15:00Z',
    date: 'Today',
    time: '9:15 AM',
    importance: 'low',
    status: 'info',
    actor: {
      name: 'Jane Smith',
      role: 'Agent'
    },
    isExpandable: true,
    metadata: {
      itemType: 'Laptop',
      serialNumber: 'LT-2023-78945',
      value: '$1,200'
    },
    actions: [
      {
        label: 'View Item',
        icon: <Eye className="h-3 w-3" />,
        onClick: () => console.log('View item')
      }
    ]
  },
  {
    id: '3',
    type: 'report',
    title: 'Lost Item Report',
    description: 'A user has reported a lost item.',
    timestamp: '2025-04-25T16:45:00Z',
    date: 'Yesterday',
    time: '4:45 PM',
    importance: 'high',
    status: 'pending',
    actor: {
      name: 'Michael Brown',
      role: 'Subscriber'
    },
    isExpandable: true,
    metadata: {
      itemType: 'Smartphone',
      brand: 'Apple iPhone 15',
      lastSeen: 'Central Park, NY',
      reward: '$100'
    },
    actions: [
      {
        label: 'Process',
        icon: <ChevronRight className="h-3 w-3" />,
        onClick: () => console.log('Process report')
      }
    ]
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Received',
    description: 'Payment received for premium subscription.',
    timestamp: '2025-04-25T14:30:00Z',
    date: 'Yesterday',
    time: '2:30 PM',
    importance: 'medium',
    status: 'success',
    actor: {
      name: 'Sarah Johnson',
      role: 'Subscriber'
    },
    isExpandable: true,
    metadata: {
      amount: '$29.99',
      paymentMethod: 'Credit Card',
      transactionId: 'txn_1234567890',
      category: 'Subscription'
    },
    actions: [
      {
        label: 'View Receipt',
        icon: <Eye className="h-3 w-3" />,
        onClick: () => console.log('View receipt')
      }
    ]
  },
  {
    id: '5',
    type: 'system',
    title: 'System Backup Complete',
    description: 'Automatic system backup completed successfully.',
    timestamp: '2025-04-25T03:00:00Z',
    date: 'Yesterday',
    time: '3:00 AM',
    importance: 'low',
    status: 'success',
    isExpandable: true,
    metadata: {
      backupSize: '1.2 GB',
      duration: '10 minutes',
      location: 'Cloud Storage'
    }
  }
];

export function MissionControl() {
  const [activeWorkspace, setActiveWorkspace] = useState('dashboard');
  const [contextualData, setContextualData] = useState<any>(null);
  const [contextualType, setContextualType] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
  
  // Command bar handlers
  const handleCommand = (command: string) => {
    console.log('Command entered:', command);
    // Process command logic here
  };
  
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Search logic here
  };
  
  const handleWorkspaceChange = (workspace: string) => {
    setActiveWorkspace(workspace);
  };
  
  // Timeline event handlers
  const handleTimelineEventClick = (event: TimelineEvent) => {
    console.log('Timeline event clicked:', event);
    setContextualData(event);
    setContextualType(event.type);
    setIsSidebarOpen(true);
  };
  
  // Render dashboard metrics
  const renderMetricsContent = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-[#00BFFF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">180</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-emerald-400 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12% from last month
              </span>
            </p>
          </CardContent>
        </Card>
        
        {/* Registered Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Registered Items
            </CardTitle>
            <Package className="h-4 w-4 text-[#00BFFF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">140</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-emerald-400 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                8% from last month
              </span>
            </p>
          </CardContent>
        </Card>
        
        {/* Pending Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Pending Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-[#00BFFF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-red-400 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                5 new today
              </span>
            </p>
          </CardContent>
        </Card>
        
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Revenue
            </CardTitle>
            <CreditCard className="h-4 w-4 text-[#00BFFF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$3,240</div>
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-emerald-400 flex items-center text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                18% from last month
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render analytics content
  const renderAnalyticsContent = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRoleDistribution data={MOCK_USER_ROLES_DATA} />
          </CardContent>
        </Card>
        
        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentStatusChart data={MOCK_PAYMENT_STATUS_DATA} />
          </CardContent>
        </Card>
        
        {/* Item Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Item Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemCategoryChart data={MOCK_ITEM_CATEGORIES_DATA} />
          </CardContent>
        </Card>
        
        {/* Payment Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentAnalyticsChart data={MOCK_PAYMENT_ANALYTICS_DATA} />
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render activity content
  const renderActivityContent = () => {
    return (
      <div>
        <ActivityTimeline 
          events={MOCK_TIMELINE_EVENTS} 
          onEventClick={handleTimelineEventClick}
          maxEvents={5}
        />
      </div>
    );
  };
  
  // Define workspace panels
  const dashboardPanels: WorkspacePanel[] = [
    {
      id: 'metrics',
      title: 'Metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      defaultSize: 25,
      minSize: 15,
      maxSize: 40,
      collapsible: true,
      content: renderMetricsContent()
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <Bell className="h-4 w-4" />,
      defaultSize: 45,
      minSize: 30,
      collapsible: true,
      content: renderAnalyticsContent()
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      icon: <Clock className="h-4 w-4" />,
      defaultSize: 30,
      minSize: 20,
      collapsible: true,
      content: renderActivityContent()
    }
  ];
  
  return (
    <div className="flex flex-col h-screen">
      {/* Command Bar */}
      <CommandBar 
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onCommand={handleCommand}
        onSearch={handleSearch}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <Workspace panels={dashboardPanels} />
      </div>
      
      {/* Quick Action Menu */}
      <QuickActionMenu position="bottom-right" />
      
      {/* Contextual Sidebar */}
      <ContextualSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        title={contextualData?.title || 'Details'}
        icon={contextualData?.type === 'user' ? <Users className="h-5 w-5" /> : 
              contextualData?.type === 'item' ? <Package className="h-5 w-5" /> : 
              contextualData?.type === 'report' ? <FileText className="h-5 w-5" /> : 
              contextualData?.type === 'payment' ? <CreditCard className="h-5 w-5" /> : 
              <AlertTriangle className="h-5 w-5" />}
        data={contextualData || {}}
        type={contextualType}
      />
    </div>
  );
}