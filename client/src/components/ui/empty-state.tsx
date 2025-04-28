import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  size?: 'default' | 'large' | 'compact';
  centered?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = 'default',
  size = 'default',
  centered = true
}: EmptyStateProps) {
  // Variant-based styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  // Size-based styling
  const getSizeClasses = () => {
    switch (size) {
      case 'large':
        return 'p-8 md:p-10';
      case 'compact':
        return 'p-4';
      default:
        return 'p-6 md:p-8';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'border rounded-lg shadow-sm',
        getVariantClasses(),
        getSizeClasses(),
        centered && 'flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-4"
      >
        {icon}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-xl font-semibold mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-muted-foreground mb-6 max-w-md"
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}