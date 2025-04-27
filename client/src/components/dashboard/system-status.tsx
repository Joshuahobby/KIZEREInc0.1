import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  HardDrive, 
  RefreshCw, 
  Server, 
  Shield, 
  Wifi 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SystemStatusItemProps {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  details?: string;
  responseTime?: number;
  uptime?: number;
  icon?: React.ReactNode;
}

interface SystemStatusProps {
  items: SystemStatusItemProps[];
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function SystemStatus({
  items,
  lastUpdated,
  onRefresh,
  className,
  isLoading = false
}: SystemStatusProps) {
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'outage' | 'maintenance'>('operational');
  
  useEffect(() => {
    // Determine overall status based on individual service statuses
    if (items.some(item => item.status === 'outage')) {
      setOverallStatus('outage');
    } else if (items.some(item => item.status === 'degraded')) {
      setOverallStatus('degraded');
    } else if (items.some(item => item.status === 'maintenance')) {
      setOverallStatus('maintenance');
    } else {
      setOverallStatus('operational');
    }
  }, [items]);

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Operational',
          color: 'bg-green-500/10 text-green-500 border-green-500/20'
        };
      case 'degraded':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Degraded',
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        };
      case 'outage':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Outage',
          color: 'bg-red-500/10 text-red-500 border-red-500/20'
        };
      case 'maintenance':
        return {
          icon: <RefreshCw className="h-4 w-4" />,
          label: 'Maintenance',
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        };
      default:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Unknown',
          color: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        };
    }
  };

  const getServiceIcon = (name: string, customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;
    
    if (name.toLowerCase().includes('database')) return <Database className="h-4 w-4" />;
    if (name.toLowerCase().includes('storage')) return <HardDrive className="h-4 w-4" />;
    if (name.toLowerCase().includes('api')) return <Server className="h-4 w-4" />;
    if (name.toLowerCase().includes('security')) return <Shield className="h-4 w-4" />;
    if (name.toLowerCase().includes('network')) return <Wifi className="h-4 w-4" />;
    
    return <Server className="h-4 w-4" />;
  };

  return (
    <Card className={cn('border border-border/50 bg-card/50 backdrop-blur-sm h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
            <CardDescription className="text-sm">
              Service health monitoring
            </CardDescription>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "text-xs px-2 py-1",
              getStatusDetails(overallStatus).color
            )}
          >
            {getStatusDetails(overallStatus).icon}
            <span className="ml-1">{getStatusDetails(overallStatus).label}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-32"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4 -mr-4">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-md border border-border/40 bg-card/30 transition-colors hover:bg-card/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        getStatusDetails(item.status).color.replace('border-', 'border ')
                      )}>
                        {getServiceIcon(item.name, item.icon)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.details}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getStatusDetails(item.status).color
                      )}
                    >
                      {getStatusDetails(item.status).label}
                    </Badge>
                  </div>
                  
                  {(item.responseTime !== undefined || item.uptime !== undefined) && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      {item.responseTime !== undefined && (
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-muted-foreground">Response Time</span>
                            <span>{item.responseTime}ms</span>
                          </div>
                          <Progress 
                            value={Math.min(100, (item.responseTime / 1000) * 100)}
                            className="h-1"
                          />
                        </div>
                      )}
                      
                      {item.uptime !== undefined && (
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-muted-foreground">Uptime</span>
                            <span>{item.uptime}%</span>
                          </div>
                          <Progress 
                            value={item.uptime}
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
        {lastUpdated ? (
          <span>Last updated: {lastUpdated}</span>
        ) : (
          <span></span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-2"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}