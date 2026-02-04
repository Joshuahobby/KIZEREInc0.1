import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function UpcomingTasksCard() {
  const tasks = [
    { text: "Review verification requests", date: "Today", priority: "high" },
    { text: "Check payment reconciliation", date: "Tomorrow", priority: "medium" },
    { text: "System maintenance", date: "Apr 30", priority: "normal" }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-md border hover:bg-muted/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-1.5 ${
                  task.priority === 'high' ? 'bg-red-500' : 
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium">{task.text}</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">{task.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
