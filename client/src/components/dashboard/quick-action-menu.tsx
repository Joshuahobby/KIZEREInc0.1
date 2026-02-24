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
  DollarSign,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
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
  position = 'bottom-left'
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [, navigate] = useLocation();

  // Toggle menu open/closed
  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';

  // Actions available in the quick action menu filtered by role
  const allActions = [
    {
      icon: <UserPlus className="h-4 w-4" />,
      label: 'Add User',
      description: 'Create a new user account',
      onClick: () => navigate('/admin/users/new'),
      roles: ['Admin']
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: 'Register Item',
      description: 'Register a new valuable item',
      onClick: () => navigate(isAdmin ? '/admin/items/new' : '/register-item'),
      roles: ['Admin', 'Agent', 'User']
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Report Lost',
      description: 'File a lost item report',
      onClick: () => navigate(isAdmin ? '/admin/reports/new?type=lost' : '/lost-found/report/lost'),
      roles: ['Admin', 'Agent', 'User']
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Report Found',
      description: 'File a found item report',
      onClick: () => navigate(isAdmin ? '/admin/reports/new?type=found' : '/lost-found/report/found'),
      roles: ['Admin', 'Agent', 'User']
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'Pending Reports',
      description: 'Review awaiting verification',
      onClick: () => navigate('/agent/reports/pending'),
      roles: ['Agent']
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      label: 'Process Reports',
      description: 'Verify and update reports',
      onClick: () => navigate('/agent/reports/process'),
      roles: ['Agent']
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'New Package',
      description: 'Create a payment package',
      onClick: () => navigate('/admin/payment-packages/new'),
      roles: ['Admin']
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: 'Payments',
      description: 'View payment dashboard',
      onClick: () => navigate('/admin/payment-dashboard'),
      roles: ['Admin']
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      description: 'View system analytics',
      onClick: () => navigate('/admin/analytics'),
      roles: ['Admin']
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      description: 'System configuration',
      onClick: () => navigate(isAdmin ? '/admin/settings' : '/profile'),
      roles: ['Admin', 'Agent', 'User']
    }
  ];

  // Filter actions based on user role
  const actions = allActions.filter(action => {
    if (!user) return false;
    // For roles field, if user role is in the list, show it
    // Default to 'User' if no role specified on user object
    const userRole = user.role || 'User';
    return action.roles.includes(userRole);
  });

  // Position classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  // Determine action menu position
  const getActionMenuPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-20 left-6';
      case 'top-right':
        return 'top-20 right-6';
      case 'bottom-left':
        return 'bottom-20 left-6';
      case 'bottom-right':
      default:
        return 'bottom-20 right-6';
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
          "fixed z-50 h-12 w-12 rounded-full shadow-lg bg-[#00BFFF] hover:bg-[#00BFFF]/90 transition-all flex",
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
              "fixed z-40 bg-card shadow-xl rounded-lg border border-border w-60",
              getActionMenuPositionClasses()
            )}
          >
            <div className="p-2 flex flex-col gap-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2 text-left rounded-md hover:bg-accent text-muted-foreground transition-colors"
                  onClick={() => {
                    action.onClick();
                    toggleMenu();
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[#00BFFF]">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
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