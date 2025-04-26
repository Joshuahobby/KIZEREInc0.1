import React, { useState } from 'react';
import {
  Plus,
  User,
  Package,
  FileText,
  Settings,
  HelpCircle,
  Sparkles,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}

interface QuickActionMenuProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function QuickActionMenu({ position = 'bottom-right' }: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };
  
  // Actions
  const actions: ActionItem[] = [
    {
      id: 'user',
      label: 'Add User',
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        console.log('Add user action');
        setIsOpen(false);
      },
      tooltip: 'Add New User'
    },
    {
      id: 'item',
      label: 'Register Item',
      icon: <Package className="h-4 w-4" />,
      onClick: () => {
        console.log('Register item action');
        setIsOpen(false);
      },
      tooltip: 'Register New Item'
    },
    {
      id: 'report',
      label: 'New Report',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        console.log('New report action');
        setIsOpen(false);
      },
      tooltip: 'Create New Report'
    },
    {
      id: 'system',
      label: 'System Check',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        console.log('System check action');
        setIsOpen(false);
      },
      tooltip: 'Run System Check'
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Sparkles className="h-4 w-4" />,
      onClick: () => {
        console.log('AI assistant action');
        setIsOpen(false);
      },
      tooltip: 'Get AI Assistance'
    }
  ];
  
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };
  
  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* Action Items */}
      {isOpen && (
        <div className={cn(
          "mb-3 flex flex-col-reverse gap-2 items-center",
          position.includes('left') && "items-start",
          position.includes('right') && "items-end"
        )}>
          {actions.map((action) => (
            <Tooltip key={action.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:text-[#00BFFF] transition-all shadow-lg"
                  onClick={action.onClick}
                >
                  {action.icon}
                  <span className="sr-only">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={position.includes('right') ? 'left' : 'right'}>
                {action.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
      
      {/* Toggle Button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transform transition-transform",
          isOpen && "rotate-45 bg-[#00BFFF] hover:bg-[#00BFFF]/90"
        )}
        onClick={toggleMenu}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Toggle quick actions</span>
      </Button>
    </div>
  );
}