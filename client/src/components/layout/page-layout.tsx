import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './header';
import { Footer } from './footer';
import { AppLayout as DashboardLayout } from './admin-layout';
import { useAuth } from '@/hooks/use-auth';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}