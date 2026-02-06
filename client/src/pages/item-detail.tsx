import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Package,
  Tag,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  QrCode,
  Shield,
  FileText,
  Share2,
  Printer,
  ChevronRight,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id || "");
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: item, isLoading, error } = useQuery<any>({
    queryKey: [`/api/items/${itemId}`],
    queryFn: () => apiRequest(`/api/items/${itemId}`),
    enabled: !!itemId && !!user
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <Skeleton className="h-8 w-24 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !item) {
    return (
      <PageLayout>
        <div className="container max-w-4xl mx-auto py-20 px-4 text-center">
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-full inline-block mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          </div>
          <h1 className="text-xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The item you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate("/my-items")} variant="default">
            Back to My Items
          </Button>
        </div>
      </PageLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registered':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 shadow-none">Registered</Badge>;
      case 'lost':
        return <Badge variant="destructive" className="shadow-none">Lost</Badge>;
      case 'found':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 shadow-none">Found</Badge>;
      case 'recovered':
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200 shadow-none">Recovered</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/my-items" className="flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6 md:gap-8">
          {/* Main Content - Left Side */}
          <div className="md:col-span-3 space-y-6">
            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 aspect-video group border border-neutral-200 dark:border-neutral-800"
            >
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img
                  src={item.imageUrls[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No image</p>
                </div>
              )}
              <div className="absolute top-3 left-3">
                {getStatusBadge(item.status)}
              </div>
            </motion.div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{item.name}</h1>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {item.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</label>
                  <div className="flex items-center mt-1 gap-1.5 font-medium text-neutral-900 dark:text-neutral-200">
                    <Tag className="h-3.5 w-3.5 text-sky-500" />
                    {item.category}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Registered</label>
                  <div className="flex items-center mt-1 gap-1.5 font-medium text-neutral-900 dark:text-neutral-200">
                    <Calendar className="h-3.5 w-3.5 text-sky-500" />
                    {format(new Date(item.registeredAt), 'MMM d, yyyy')}
                  </div>
                </div>
                {item.location && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Location</label>
                    <div className="flex items-center mt-1 gap-1.5 font-medium text-neutral-900 dark:text-neutral-200">
                      <MapPin className="h-3.5 w-3.5 text-sky-500" />
                      {item.location}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="md:col-span-2 space-y-4">
            {/* ID Card */}
            <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase">Item ID</p>
                    <p className="font-mono text-sm font-bold mt-1 text-neutral-900 dark:text-white">{item.uniqueIdentifier}</p>
                  </div>
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="bg-white dark:bg-black p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
                  <div className="h-12 w-12 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                    <QrCode className="h-8 w-8 text-neutral-900 dark:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Smart Tag Active</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-sky-600 text-xs">
                      Download Label
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500 uppercase pl-1">Actions</p>

              {item.status === 'Registered' && (
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => navigate(`/lost-found/report?type=lost&itemId=${item.id}`)}
                >
                  <span className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    Report Lost
                  </span>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Button>
              )}

              {item.status === 'Lost' && (
                <Button
                  className="w-full justify-between border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  variant="outline"
                >
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Found
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Button>
              )}

              <Button className="w-full justify-between" variant="outline">
                <span className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-sky-500" />
                  View Certificate
                </span>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Button>

              <Button
                className="w-full justify-between"
                variant="outline"
                onClick={() => navigate(`/items/${item.id}/edit`)}
              >
                <span className="flex items-center">
                  <Edit className="mr-2 h-4 w-4 text-neutral-500" />
                  Edit Details
                </span>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
