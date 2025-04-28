import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Plus, 
  X, 
  UserPlus, 
  Package, 
  FileText, 
  BarChart3, 
  Settings,
  FileEdit,
  BookOpen,
  Zap,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionMenuProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function QuickActionMenu({ 
  isOpen: propIsOpen, 
  onOpenChange,
  className,
  position = 'bottom-right'
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [, navigate] = useLocation();

  // Toggle menu open/closed
  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  // Actions available in the quick action menu
  const actions = [
    {
      icon: <UserPlus className="h-4 w-4" />,
      label: 'Add User',
      description: 'Create a new user account',
      onClick: () => navigate('/admin/users/new')
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: 'Register Item',
      description: 'Register a new valuable item',
      onClick: () => navigate('/admin/items/new')
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'New Report',
      description: 'Create a lost or found report',
      onClick: () => navigate('/admin/reports/new')
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      description: 'View system analytics',
      onClick: () => navigate('/admin/analytics')
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      description: 'System configuration',
      onClick: () => navigate('/admin/settings')
    }
  ];

  // Position classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  // Determine action menu position
  const getActionMenuPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-16 left-4';
      case 'top-right':
        return 'top-16 right-4';
      case 'bottom-left':
        return 'bottom-16 left-4';
      case 'bottom-right':
      default:
        return 'bottom-16 right-4';
    }
  };

  return (
    <>
      {/* Backdrop when menu is open (mobile only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>
      
      {/* Quick action button */}
      <Button
        size="icon"
        className={cn(
          "fixed z-50 h-12 w-12 rounded-full shadow-lg bg-[#00BFFF] hover:bg-[#00BFFF]/90 transition-all",
          getPositionClasses(),
          className
        )}
        onClick={toggleMenu}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Zap className="h-5 w-5" />
        )}
      </Button>
      
      {/* Action menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "fixed z-40 bg-gray-900 shadow-xl rounded-lg border border-gray-800 w-60",
              getActionMenuPositionClasses()
            )}
          >
            <div className="p-2 flex flex-col gap-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2 text-left rounded-md hover:bg-gray-800 text-gray-300 transition-colors"
                  onClick={() => {
                    action.onClick();
                    toggleMenu();
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[#00BFFF]">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-gray-400 truncate">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}