import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = 'default'
}: EmptyStateProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return {
          ring: 'ring-sky-100 dark:ring-sky-900/30',
          bg: 'bg-sky-50 dark:bg-sky-900/20',
          iconBg: 'bg-sky-100 dark:bg-sky-900/30',
          border: 'border-sky-200 dark:border-sky-800/50'
        };
      case 'warning':
        return {
          ring: 'ring-yellow-100 dark:ring-yellow-900/30',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          border: 'border-yellow-200 dark:border-yellow-800/50'
        };
      case 'success':
        return {
          ring: 'ring-green-100 dark:ring-green-900/30',
          bg: 'bg-green-50 dark:bg-green-900/20',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800/50'
        };
      case 'error':
        return {
          ring: 'ring-red-100 dark:ring-red-900/30',
          bg: 'bg-red-50 dark:bg-red-900/20',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800/50'
        };
      default:
        return {
          ring: 'ring-gray-100 dark:ring-gray-800/50',
          bg: 'bg-gray-50 dark:bg-gray-900/30',
          iconBg: 'bg-gray-100 dark:bg-gray-800/50',
          border: 'border-gray-200 dark:border-gray-700/50'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed rounded-lg ${styles.bg} ${styles.border}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {icon && (
        <motion.div 
          className={`rounded-full ${styles.iconBg} p-6 mb-6 ring-4 ${styles.ring} shadow-sm`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1, 
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
        >
          {icon}
        </motion.div>
      )}
      <motion.h3 
        className="text-xl font-medium mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p 
          className="text-muted-foreground max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}