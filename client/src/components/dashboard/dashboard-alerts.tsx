import React from 'react';
import { AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardAlerts() {
  return (
    <div className="space-y-4">
      <Card className="border-yellow-500/20 bg-yellow-500/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-foreground">3 pending verifications</h4>
              <p className="text-xs text-muted-foreground mt-1">Items awaiting your approval</p>
              <Button variant="link" size="sm" className="h-6 px-0 text-xs mt-2 text-yellow-600 dark:text-yellow-500">
                Review now <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-foreground">Revenue up 12% this week</h4>
              <p className="text-xs text-muted-foreground mt-1">Registration payments increased</p>
              <Button variant="link" size="sm" className="h-6 px-0 text-xs mt-2 text-blue-600 dark:text-blue-500">
                View report <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
