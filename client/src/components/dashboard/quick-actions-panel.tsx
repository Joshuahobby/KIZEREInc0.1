import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import {
  Plus,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpFromLine,
  Settings,
  HelpCircle,
  BookOpen,
  BellRing
} from 'lucide-react';

interface QuickActionsPanelProps {
  user: Omit<User, 'password'>;
  variant?: 'default' | 'compact' | 'card';
}

/**
 * Quick Actions Panel Component
 * 
 * Provides convenient access to the most frequently used actions based on user role,
 * improving accessibility of key platform features.
 */
export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  user,
  variant = 'default'
}) => {
  const [, navigate] = useLocation();
  
  // Determine if user has admin or agent role
  const isAdmin = user.role === 'Admin';
  const isAgent = user.role === 'Agent';
  
  // Define action items based on user role
  const getActions = () => {
    const baseActions = [
      {
        id: 'register-item',
        label: 'Register Item',
        description: 'Register a new item in the system',
        icon: <Plus className="h-5 w-5" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        action: () => navigate('/register-item')
      },
      {
        id: 'report-lost',
        label: 'Report Lost',
        description: 'File a report for a lost item',
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        action: () => navigate('/lost-found/report/lost')
      },
      {
        id: 'report-found',
        label: 'Report Found',
        description: 'Submit a found item report',
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        action: () => navigate('/lost-found/report/found')
      },
      {
        id: 'search-items',
        label: 'Search Items',
        description: 'Search for registered items',
        icon: <Search className="h-5 w-5" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        action: () => navigate('/search')
      }
    ];
    
    // Additional actions for admin users
    const adminActions = [
      {
        id: 'manage-users',
        label: 'Manage Users',
        description: 'View and manage platform users',
        icon: <Settings className="h-5 w-5" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        action: () => navigate('/admin/users')
      },
      {
        id: 'analytics',
        label: 'Analytics',
        description: 'View platform analytics dashboard',
        icon: <FileText className="h-5 w-5" />,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        action: () => navigate('/admin/analytics')
      }
    ];
    
    // Additional actions for agent users
    const agentActions = [
      {
        id: 'review-reports',
        label: 'Review Reports',
        description: 'Review and process pending reports',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        action: () => navigate('/agent/reports')
      },
      {
        id: 'match-items',
        label: 'Match Items',
        description: 'Match lost items with found reports',
        icon: <ArrowUpFromLine className="h-5 w-5" />,
        color: 'text-teal-500',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        action: () => navigate('/agent/match')
      }
    ];
    
    // Assemble the final action list based on user role
    let actions = [...baseActions];
    
    if (isAdmin) {
      actions = [...actions, ...adminActions];
    }
    
    if (isAgent) {
      actions = [...actions, ...agentActions];
    }
    
    // Add help-related actions at the end for all users
    actions.push(
      {
        id: 'help-center',
        label: 'Help Center',
        description: 'Get help and support',
        icon: <HelpCircle className="h-5 w-5" />,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800/50',
        action: () => navigate('/help')
      }
    );
    
    return actions;
  };
  
  const actions = getActions();
  
  // Determine how many actions to display based on variant
  const displayActions = variant === 'compact' ? actions.slice(0, 4) : actions;
  
  // Render quick actions in a grid layout with icons and labels
  const renderActionGrid = () => {
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {displayActions.map((action) => (
          <motion.div 
            key={action.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="outline"
              className="h-auto py-4 px-4 w-full flex flex-col items-center justify-center text-center border border-border/50 hover:border-primary/30 hover:bg-card/70"
              onClick={action.action}
            >
              <div className={`rounded-full ${action.bgColor} ${action.color} p-3 mb-2`}>
                {action.icon}
              </div>
              <div className="font-medium text-sm">{action.label}</div>
              {variant !== 'compact' && (
                <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    );
  };
  
  // Render quick actions as a list with horizontal layout
  const renderActionList = () => {
    return (
      <div className="flex space-x-2 overflow-x-auto py-2 px-1 -mx-1">
        {displayActions.map((action) => (
          <motion.div 
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center justify-center border border-border/50 hover:border-primary/30"
              onClick={action.action}
            >
              <div className={`rounded-full ${action.bgColor} ${action.color} p-2 mb-2`}>
                {action.icon}
              </div>
              <div className="font-medium text-xs whitespace-nowrap">{action.label}</div>
            </Button>
          </motion.div>
        ))}
      </div>
    );
  };
  
  // Render content based on variant
  const renderContent = () => {
    if (variant === 'card') {
      return (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center">
              <BellRing className="h-5 w-5 mr-2 text-[#00BFFF]" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used actions and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderActionGrid()}
          </CardContent>
        </Card>
      );
    }
    
    if (variant === 'compact') {
      return renderActionList();
    }
    
    return (
      <div>
        <h3 className="text-lg font-medium flex items-center">
          <BellRing className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Quick Actions
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Frequently used actions and tools
        </p>
        {renderActionGrid()}
      </div>
    );
  };
  
  return renderContent();
};