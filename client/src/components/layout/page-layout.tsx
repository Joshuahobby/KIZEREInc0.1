import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Package, User, Search, AlertTriangle, LayoutDashboard, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth(); // Remove logout as it may not exist in the auth context
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col min-h-screen">
        <header className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled 
            ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md' 
            : 'bg-white dark:bg-gray-800'
        } border-b border-gray-200 dark:border-gray-700`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard">
                <a className="flex items-center space-x-2 group">
                  <motion.span 
                    className="text-2xl font-bold text-sky-500 dark:text-sky-400"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    KIZERE
                    <span className="ml-1 text-yellow-400">●</span>
                  </motion.span>
                </a>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <NavLink href="/dashboard" isActive={isActive("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </NavLink>
                <NavLink href="/register-item" isActive={isActive("/register-item")}>
                  <Package className="h-4 w-4 mr-1" />
                  Register Item
                </NavLink>
                <NavLink href="/my-items" isActive={isActive("/my-items")}>
                  <Package className="h-4 w-4 mr-1" />
                  My Items
                </NavLink>
                <NavLink href="/lost-found" isActive={isActive("/lost-found")}>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Lost & Found
                </NavLink>
                <NavLink href="/search" isActive={isActive("/search")}>
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </NavLink>
              </nav>
              
              {/* User Profile */}
              <div className="relative flex items-center space-x-4">
                {/* Mobile menu toggle */}
                <button 
                  className="md:hidden p-2 rounded-md text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Profile dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center space-x-1 text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400 focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <motion.div 
                      className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center overflow-hidden"
                      whileTap={{ scale: 0.95 }}
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                      )}
                    </motion.div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div 
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium">{user?.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <Link href="/profile">
                          <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                            Profile
                          </a>
                        </Link>
                        <Link href="/">
                          <a className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign out
                            </div>
                          </a>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile navigation drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                className="md:hidden border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="py-3 px-4 space-y-3">
                  <MobileNavLink href="/dashboard" isActive={isActive("/dashboard")} onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink href="/register-item" isActive={isActive("/register-item")} onClick={() => setMobileMenuOpen(false)}>
                    <Package className="h-5 w-5 mr-3" />
                    Register Item
                  </MobileNavLink>
                  <MobileNavLink href="/my-items" isActive={isActive("/my-items")} onClick={() => setMobileMenuOpen(false)}>
                    <Package className="h-5 w-5 mr-3" />
                    My Items
                  </MobileNavLink>
                  <MobileNavLink href="/lost-found" isActive={isActive("/lost-found")} onClick={() => setMobileMenuOpen(false)}>
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    Lost & Found
                  </MobileNavLink>
                  <MobileNavLink href="/search" isActive={isActive("/search")} onClick={() => setMobileMenuOpen(false)}>
                    <Search className="h-5 w-5 mr-3" />
                    Search
                  </MobileNavLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
        
        <main className="flex-grow">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
        
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="text-xl font-bold text-sky-500 dark:text-sky-400 mr-2">KIZERE</span>
                <span className="text-yellow-400 text-xl">●</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} KIZERE - Item Registration & Management Platform
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Desktop navigation link component with animations
interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

function NavLink({ href, isActive, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <a className={`flex items-center px-3 py-2 rounded-md transition-colors relative ${
        isActive 
          ? 'text-sky-500 dark:text-sky-400' 
          : 'text-gray-600 hover:text-sky-500 dark:text-gray-300 dark:hover:text-sky-400'
      }`}>
        {children}
        {isActive && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 dark:bg-sky-400 rounded"
            layoutId="navIndicator"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </a>
    </Link>
  );
}

// Mobile navigation link component with animations
interface MobileNavLinkProps {
  href: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MobileNavLink({ href, isActive, onClick, children }: MobileNavLinkProps) {
  return (
    <Link href={href}>
      <a 
        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? 'bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-400' 
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30'
        }`}
        onClick={onClick}
      >
        {children}
      </a>
    </Link>
  );
}