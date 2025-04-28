import React, { ReactNode } from 'react';
import { Link } from 'wouter';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard">
                <a className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-sky-500">KIZERE</span>
                </a>
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/dashboard">
                  <a className="text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400">
                    Dashboard
                  </a>
                </Link>
                <Link href="/register-item">
                  <a className="text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400">
                    Register Item
                  </a>
                </Link>
                <Link href="/my-items">
                  <a className="text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400">
                    My Items
                  </a>
                </Link>
                <Link href="/lost-found">
                  <a className="text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400">
                    Lost & Found
                  </a>
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <a className="text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400">
                    Profile
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} KIZERE - Item Registration & Management Platform
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}