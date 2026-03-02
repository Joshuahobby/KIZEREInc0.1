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
import { useLanguage } from '@/lib/i18n/LanguageContext';
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
  const { t } = useLanguage();

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
      label: t('dashboard.quickActions.addUser'),
      description: t('dashboard.quickActions.addUserDesc'),
      onClick: () => navigate('/admin/users/new'),
      roles: ['Admin']
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: t('dashboard.quickActions.registerItem'),
      description: t('dashboard.quickActions.registerItemDesc'),
      onClick: () => navigate(isAdmin ? '/admin/items/new' : '/register-item'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: t('dashboard.quickActions.reportLost'),
      description: t('dashboard.quickActions.reportLostDesc'),
      onClick: () => navigate(isAdmin ? '/admin/reports/new?type=lost' : '/lost-found/report/lost'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t('dashboard.quickActions.reportFound'),
      description: t('dashboard.quickActions.reportFoundDesc'),
      onClick: () => navigate(isAdmin ? '/admin/reports/new?type=found' : '/lost-found/report/found'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: t('dashboard.quickActions.pendingReports'),
      description: t('dashboard.quickActions.pendingReportsDesc'),
      onClick: () => navigate('/agent/reports/pending'),
      roles: ['Agent', 'Moderator', 'Admin']
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      label: t('dashboard.quickActions.processReports'),
      description: t('dashboard.quickActions.processReportsDesc'),
      onClick: () => navigate('/agent/reports/process'),
      roles: ['Agent', 'Moderator', 'Admin']
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: t('dashboard.quickActions.newPackage'),
      description: t('dashboard.quickActions.newPackageDesc'),
      onClick: () => navigate('/admin/payment-packages/new'),
      roles: ['Admin']
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: t('dashboard.quickActions.payments'),
      description: t('dashboard.quickActions.paymentsDesc'),
      onClick: () => navigate('/admin/payment-dashboard'),
      roles: ['Admin']
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: t('dashboard.quickActions.analytics'),
      description: t('dashboard.quickActions.analyticsDesc'),
      onClick: () => navigate('/admin/analytics'),
      roles: ['Admin']
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: t('dashboard.quickActions.settings'),
      description: t('dashboard.quickActions.settingsDesc'),
      onClick: () => navigate(isAdmin ? '/admin/settings' : '/profile'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    }
  ];

  // Filter actions based on user role
  const actions = allActions.filter(action => {
    if (!user) return false;
    // For roles field, if user role is in the list, show it
    // Default to 'Subscriber' if no role specified on user object
    const userRole = user.role || 'Subscriber';
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
          "fixed z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex",
          getPositionClasses(),
          className
        )}
        onClick={toggleMenu}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Zap className="h-5 w-5 fill-current" />
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
              "fixed z-40 bg-card/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-border/50 w-64 overflow-hidden",
              getActionMenuPositionClasses()
            )}
          >
            <div className="p-2 flex flex-col gap-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2.5 text-left rounded-xl hover:bg-primary/10 text-muted-foreground transition-all group"
                  onClick={() => {
                    action.onClick();
                    toggleMenu();
                  }}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
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