import React, { useState } from 'react';
import { 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  User, 
  Package, 
  FileText, 
  CreditCard,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Event types
export type EventType = 'user' | 'item' | 'report' | 'payment' | 'system';
export type EventImportance = 'low' | 'medium' | 'high';
export type EventStatus = 'success' | 'info' | 'pending' | 'error';

export interface TimelineAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface TimelineActor {
  name: string;
  role?: string;
  avatar?: string;
}

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  date: string;
  time: string;
  importance: EventImportance;
  status: EventStatus;
  actor?: TimelineActor;
  isExpandable?: boolean;
  metadata?: Record<string, any>;
  actions?: TimelineAction[];
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  maxEvents?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

export function ActivityTimeline({ events, maxEvents = 5, onEventClick }: ActivityTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<{
    types?: string[];
    importance?: string[];
    status?: string[];
  }>({});
  
  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    // Type filter
    if (filters.types && filters.types.length > 0 && !filters.types.includes(event.type)) {
      return false;
    }
    
    // Importance filter
    if (filters.importance && filters.importance.length > 0 && !filters.importance.includes(event.importance)) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0 && !filters.status.includes(event.status)) {
      return false;
    }
    
    return true;
  });
  
  const displayedEvents = filteredEvents.slice(0, maxEvents);
  
  // Toggle expanded state of an event
  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  // Handle filter changes
  const toggleFilter = (filterType: 'types' | 'importance' | 'status', value: string) => {
    setFilters(prev => {
      const currentFilters = prev[filterType] || [];
      const isActive = currentFilters.includes(value);
      
      return {
        ...prev,
        [filterType]: isActive
          ? currentFilters.filter(v => v !== value)
          : [...currentFilters, value]
      };
    });
  };
  
  // Get event icon based on type
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'item':
        return <Package className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Get status icon based on status
  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };
  
  // Get background color based on importance
  const getImportanceColor = (importance: EventImportance) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/10';
      case 'medium':
        return 'bg-amber-500/10';
      case 'low':
        return 'bg-transparent';
      default:
        return 'bg-transparent';
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Timeline Filter (hidden for now, can be expanded) */}
      {/* <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn("text-xs", filters.types?.includes('user') && "bg-gray-800")}
            onClick={() => toggleFilter('types', 'user')}
          >
            <User className="h-3 w-3 mr-1" />
            Users
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className={cn("text-xs", filters.types?.includes('item') && "bg-gray-800")}
            onClick={() => toggleFilter('types', 'item')}
          >
            <Package className="h-3 w-3 mr-1" />
            Items
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className={cn("text-xs", filters.types?.includes('report') && "bg-gray-800")}
            onClick={() => toggleFilter('types', 'report')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Reports
          </Button>
        </div>
      </div> */}
      
      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Info className="h-6 w-6 mb-2" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedEvents.map((event) => {
              const isExpanded = expandedEvents[event.id];
              
              return (
                <div 
                  key={event.id} 
                  className={cn(
                    "p-3 rounded-md border border-gray-800 transition-colors",
                    getImportanceColor(event.importance),
                    event.isExpandable && "cursor-pointer hover:bg-gray-800/50"
                  )}
                  onClick={() => {
                    if (event.isExpandable) {
                      toggleEventExpanded(event.id);
                    }
                    if (onEventClick) {
                      onEventClick(event);
                    }
                  }}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "rounded-full p-2 flex items-center justify-center",
                        event.status === 'success' && "bg-emerald-500/20 text-emerald-400",
                        event.status === 'pending' && "bg-amber-500/20 text-amber-400",
                        event.status === 'error' && "bg-red-500/20 text-red-400",
                        event.status === 'info' && "bg-blue-500/20 text-blue-400"
                      )}>
                        {getEventIcon(event.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-white mr-2">{event.title}</h4>
                          {getStatusIcon(event.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{event.date}</p>
                        <p className="text-xs font-medium text-gray-400">{event.time}</p>
                      </div>
                      
                      {event.isExpandable && (
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 text-gray-400 transition-transform", 
                            isExpanded && "transform rotate-90"
                          )} 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && event.isExpandable && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      {/* Actor Info */}
                      {event.actor && (
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[#00BFFF] mr-3">
                            {event.actor.avatar ? (
                              <img 
                                src={event.actor.avatar} 
                                alt={event.actor.name} 
                                className="h-full w-full rounded-full object-cover"
                                width={32}
                                height={32}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className="text-sm font-bold">
                                {event.actor.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-white">{event.actor.name}</p>
                            {event.actor.role && (
                              <p className="text-xs text-gray-400">{event.actor.role}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500 block">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                              <span className="text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      {event.actions && event.actions.length > 0 && (
                        <div className="flex mt-2 space-x-2">
                          {event.actions.map((action, i) => (
                            <Button 
                              key={i} 
                              variant="outline" 
                              size="sm" 
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                              }}
                            >
                              {action.icon && <span className="mr-1">{action.icon}</span>}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredEvents.length > maxEvents && (
              <div className="pt-2 text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-[#00BFFF]"
                >
                  View all {filteredEvents.length} activities
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}