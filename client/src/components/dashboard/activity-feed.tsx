import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Info,
  Package,
  User,
  CreditCard,
  ArrowRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityEvent {
  id: number | string;
  title: string;
  time: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  category: 'items' | 'users' | 'reports' | 'revenue' | 'system';
  user?: {
    name: string;
    avatarUrl?: string;
  };
  itemId?: number;
  reportId?: number;
  paymentId?: number;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  title?: string;
  description?: string;
  maxHeight?: number;
  onEventClick?: (event: ActivityEvent) => void;
  onFilterChange?: (category: string) => void;
  activeCategory?: string;
  className?: string;
}

export function ActivityFeed({
  events,
  title = 'System Insights',
  description = 'Recent activity and important updates',
  maxHeight = 500,
  onEventClick,
  onFilterChange,
  activeCategory = 'all',
  className
}: ActivityFeedProps) {
  // Helper to get icon based on type
  const getEventIcon = (type: string, category: string) => {
    if (type === 'alert') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (type === 'info') return <Info className="h-5 w-5 text-blue-500" />;
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    
    // Fallback to category icons
    switch (category) {
      case 'items':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'users':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'reports':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'revenue':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  // Helper to get badge style based on type
  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" 
              size="sm"
              className={cn(
                "h-8 text-xs py-0 px-2",
                activeCategory === 'all' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => onFilterChange && onFilterChange('all')}
            >
              All
            </Button>
            <Button
              variant="outline" 
              size="sm"
              className={cn(
                "h-8 text-xs py-0 px-2",
                activeCategory === 'items' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => onFilterChange && onFilterChange('items')}
            >
              <Package className="h-3 w-3 mr-1" />
              Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs py-0 px-2",
                activeCategory === 'users' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => onFilterChange && onFilterChange('users')}
            >
              <User className="h-3 w-3 mr-1" />
              Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs py-0 px-2",
                activeCategory === 'revenue' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => onFilterChange && onFilterChange('revenue')}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Revenue
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`pr-4 -mr-4`} style={{ maxHeight: `${maxHeight}px` }}>
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => onEventClick && onEventClick(event)}
                >
                  <div className="shrink-0">
                    {getEventIcon(event.type, event.category)}
                  </div>
                  <div className="grow space-y-1">
                    <div className="flex justify-between">
                      <div className="font-medium text-sm">{event.title}</div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-normal", getEventBadgeStyle(event.type))}
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.message}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No activity found for the selected filter.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}