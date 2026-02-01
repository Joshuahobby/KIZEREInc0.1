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
  FileText
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
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !item) {
    return (
      <PageLayout>
        <div className="container max-w-5xl mx-auto py-20 px-4 text-center">
          <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl inline-block mb-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
          <p className="text-muted-foreground mb-8">
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
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-1">Registered</Badge>;
      case 'lost':
        return <Badge variant="destructive" className="px-3 py-1">Lost</Badge>;
      case 'found':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1">Found</Badge>;
      case 'recovered':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-none px-3 py-1">Recovered</Badge>;
      default:
        return <Badge variant="outline" className="px-3 py-1">{status}</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header Navigation */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-muted-foreground hover:text-foreground transition-colors -ml-2"
          >
            <Link href="/my-items">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Items
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content Side */}
          <div className="md:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 aspect-video group"
            >
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img 
                  src={item.imageUrls[0]} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-16 w-16 mb-4 opacity-20" />
                  <p>No images available</p>
                </div>
              )}
              
              <div className="absolute top-4 left-4">
                {getStatusBadge(item.status)}
              </div>
            </motion.div>

            {/* Description Card */}
            <Card className="border-none shadow-sm bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-1">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Item Details</span>
                </div>
                <CardTitle className="text-3xl font-bold">{item.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {item.description || "No description provided for this item."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Category</p>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-sky-500" />
                      <span className="font-medium">{item.category}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Identifier</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-sky-500" />
                      <span className="font-mono text-sm font-medium">{item.uniqueIdentifier}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Registered At</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sky-500" />
                      <span className="font-medium">{format(new Date(item.registeredAt), 'PPP')}</span>
                    </div>
                  </div>
                </div>

                {item.location && (
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight mb-2">Last Known Location</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-sky-500" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Actions Side */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-neutral-900 text-white overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-sky-400" />
                  Smart Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-xl aspect-square flex items-center justify-center mb-2">
                  <div className="w-full h-full border-2 border-dashed border-neutral-200 rounded-lg flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-neutral-900 opacity-80" />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 text-center leading-relaxed px-2">
                  This unique QR code can be used to scan and identify your item instantly in case of loss.
                </p>
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white border-none font-bold">
                  Download Security Label
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.status === 'Registered' && (
                  <Button 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" 
                    variant="outline"
                    onClick={() => navigate(`/lost-found/report?type=lost&itemId=${item.id}`)}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report as Lost
                  </Button>
                )}
                
                {item.status === 'Lost' && (
                  <Button 
                    className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                    variant="outline"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Found
                  </Button>
                )}

                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Digital Ownership Cert
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
