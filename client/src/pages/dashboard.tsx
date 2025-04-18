import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OwnershipTransferDialog } from "@/components/ui/ownership-transfer-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, ClipboardList, AlertTriangle, CheckCircle2, Bell, Calendar, Tag, MapPin } from "lucide-react";
import { Item, Notification } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch user items
  const { data: items, isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Fetch notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">Welcome back, {user.fullName || user.username}!</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Registered Items Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                          <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">Registered Items</dt>
                            <dd>
                              {isLoadingStats ? (
                                <Skeleton className="h-7 w-12" />
                              ) : (
                                <div className="text-lg font-semibold text-foreground">{stats?.registeredItems || 0}</div>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 px-4 py-4 sm:px-6 border-t border-border">
                      <div className="text-sm">
                        <Link href="/register-item">
                          <a className="font-medium text-primary hover:underline flex items-center">
                            View all
                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Lost Items Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-md p-3">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">Lost Items</dt>
                            <dd>
                              {isLoadingStats ? (
                                <Skeleton className="h-7 w-12" />
                              ) : (
                                <div className="text-lg font-semibold text-foreground">{stats?.lostItems || 0}</div>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 px-4 py-4 sm:px-6 border-t border-border">
                      <div className="text-sm">
                        <Link href="/lost-found?type=lost">
                          <a className="font-medium text-primary hover:underline flex items-center">
                            View all
                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Found Items Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">Found Items</dt>
                            <dd>
                              {isLoadingStats ? (
                                <Skeleton className="h-7 w-12" />
                              ) : (
                                <div className="text-lg font-semibold text-foreground">{stats?.foundItems || 0}</div>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 px-4 py-4 sm:px-6 border-t border-border">
                      <div className="text-sm">
                        <Link href="/lost-found?type=found">
                          <a className="font-medium text-primary hover:underline flex items-center">
                            View all
                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 rounded-md p-3">
                          <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">Notifications</dt>
                            <dd>
                              {isLoadingStats ? (
                                <Skeleton className="h-7 w-12" />
                              ) : (
                                <div className="text-lg font-semibold text-foreground">{stats?.notifications || 0}</div>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 px-4 py-4 sm:px-6 border-t border-border">
                      <div className="text-sm">
                        <a href="#notifications" className="font-medium text-primary hover:underline flex items-center">
                          View all
                          <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recently Registered Items Section */}
            <div className="flex items-center justify-between mt-8">
              <h2 className="text-lg leading-6 font-display font-medium text-foreground">Recently Registered Items</h2>
              <ThemeToggle />
            </div>
            <Card className="mt-4">
              <CardContent className="p-0">
                {isLoadingItems ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : items && items.length > 0 ? (
                  <ul role="list" className="divide-y divide-border">
                    {items.slice(0, 3).map((item) => (
                      <motion.li 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <Link href={`/items/${item.id}`}>
                              <a className="text-sm font-medium text-primary hover:underline truncate">{item.name}</a>
                            </Link>
                            <div className="ml-2 flex items-center gap-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'Registered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                                item.status === 'Lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : 
                                'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                              }`}>
                                {item.status}
                              </span>
                              <OwnershipTransferDialog 
                                itemId={item.id} 
                                itemName={item.name}
                                onSuccess={() => {
                                  // Refetch items after ownership transfer
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                              {format(new Date(item.registeredAt), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                              {item.category}
                            </div>
                            {item.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                                {item.location}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex items-center gap-3 text-sm">
                            <Link href={`/items/${item.id}`}>
                              <a className="text-primary hover:underline flex items-center">
                                View details
                              </a>
                            </Link>
                            {item.status === 'Registered' && (
                              <Link href={`/lost-found/report?itemId=${item.id}&type=lost`}>
                                <a className="text-red-600 hover:underline dark:text-red-400 flex items-center">
                                  Report lost
                                </a>
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">You haven't registered any items yet.</p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => window.location.href = '/register-item'}
                    >
                      Register your first item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Notification Section */}
            <h2 className="text-lg leading-6 font-display font-medium text-foreground mt-8">Recent Notifications</h2>
            <Card className="mt-4">
              <CardContent className="p-0">
                {isLoadingNotifications ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <ul role="list" className="divide-y divide-border">
                    {notifications.slice(0, 2).map((notification) => (
                      <motion.li 
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="block px-4 py-4 sm:px-6 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center">
                            <div className="min-w-0 flex-1 flex items-center">
                              <div className="flex-shrink-0">
                                {notification.type === 'item_found' ? (
                                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                  </div>
                                ) : notification.type === 'ownership_transfer' ? (
                                  <div className="p-2 rounded-full bg-primary/10">
                                    <motion.div
                                      animate={{ rotate: [0, 10, 0] }}
                                      transition={{ repeat: 0, duration: 0.5 }}
                                    >
                                      <Tag className="h-6 w-6 text-primary" />
                                    </motion.div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                    <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 px-4">
                                <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                                <p className="mt-1 flex items-center text-sm text-muted-foreground">{notification.message}</p>
                              </div>
                            </div>
                            <div className="ml-5 flex-shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="mt-2 ml-14">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                New
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">You don't have any notifications yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
