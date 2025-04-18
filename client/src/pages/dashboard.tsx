import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ClipboardList, AlertTriangle, CheckCircle2, Bell } from "lucide-react";
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
            <h1 className="text-2xl font-display font-semibold text-neutral-900">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-500">Welcome back, {user.fullName}!</p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Registered Items Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        <ClipboardList className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-neutral-500 truncate">Registered Items</dt>
                          <dd>
                            {isLoadingStats ? (
                              <Skeleton className="h-7 w-12 bg-neutral-200" />
                            ) : (
                              <div className="text-lg font-semibold text-neutral-900">{stats?.registeredItems || 0}</div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link href="/register">
                        <a className="font-medium text-primary-600 hover:text-primary-500">View all</a>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lost Items Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-neutral-500 truncate">Lost Items</dt>
                          <dd>
                            {isLoadingStats ? (
                              <Skeleton className="h-7 w-12 bg-neutral-200" />
                            ) : (
                              <div className="text-lg font-semibold text-neutral-900">{stats?.lostItems || 0}</div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link href="/lost-found?type=lost">
                        <a className="font-medium text-primary-600 hover:text-primary-500">View all</a>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Found Items Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-neutral-500 truncate">Found Items</dt>
                          <dd>
                            {isLoadingStats ? (
                              <Skeleton className="h-7 w-12 bg-neutral-200" />
                            ) : (
                              <div className="text-lg font-semibold text-neutral-900">{stats?.foundItems || 0}</div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link href="/lost-found?type=found">
                        <a className="font-medium text-primary-600 hover:text-primary-500">View all</a>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                        <Bell className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-neutral-500 truncate">Notifications</dt>
                          <dd>
                            {isLoadingStats ? (
                              <Skeleton className="h-7 w-12 bg-neutral-200" />
                            ) : (
                              <div className="text-lg font-semibold text-neutral-900">{stats?.notifications || 0}</div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <a href="#notifications" className="font-medium text-primary-600 hover:text-primary-500">View all</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recently Registered Items Section */}
            <h2 className="text-lg leading-6 font-display font-medium text-neutral-900 mt-8">Recently Registered Items</h2>
            <Card className="mt-4">
              <CardContent className="p-0">
                {isLoadingItems ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : items && items.length > 0 ? (
                  <ul role="list" className="divide-y divide-gray-200">
                    {items.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link href={`/items/${item.id}`}>
                          <a className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-primary-600 truncate">{item.name}</p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.status === 'Registered' ? 'bg-green-100 text-green-800' : 
                                    item.status === 'Lost' ? 'bg-red-100 text-red-800' : 
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.status}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-neutral-500">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {format(new Date(item.registeredAt), 'MMM d, yyyy')}
                                  </p>
                                  <p className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0 sm:ml-6">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    {item.category}
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  View details
                                </div>
                              </div>
                            </div>
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500">You haven't registered any items yet.</p>
                    <Link href="/register">
                      <a className="mt-2 inline-block text-primary-600 hover:text-primary-700">Register your first item</a>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Notification Section */}
            <h2 className="text-lg leading-6 font-display font-medium text-neutral-900 mt-8">Recent Notifications</h2>
            <Card className="mt-4">
              <CardContent className="p-0">
                {isLoadingNotifications ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <ul role="list" className="divide-y divide-gray-200">
                    {notifications.slice(0, 2).map((notification) => (
                      <li key={notification.id}>
                        <a href={`#notification-${notification.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center">
                              <div className="min-w-0 flex-1 flex items-center">
                                <div className="flex-shrink-0">
                                  {notification.type === 'item_found' ? (
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                  ) : (
                                    <Bell className="h-8 w-8 text-amber-500" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 px-4">
                                  <p className="text-sm font-medium text-neutral-900 truncate">{notification.title}</p>
                                  <p className="mt-1 flex items-center text-sm text-neutral-500">{notification.message}</p>
                                </div>
                              </div>
                              <div className="ml-5 flex-shrink-0">
                                <span className="text-sm text-neutral-500">
                                  {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500">You don't have any notifications yet.</p>
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
