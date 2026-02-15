import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './header';
import { Footer } from './footer';
import { AppLayout as DashboardLayout } from './admin-layout';
import { useAuth } from '@/hooks/use-auth';
import { SEO } from '../seo/seo';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <SEO title={title} description={description} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          role="main"
        >
          {children}
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col min-h-screen">
        <SEO title={title} description={description} />
        <Header />

        <main id="main-content" className="flex-grow" role="main" aria-label="Main content">
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