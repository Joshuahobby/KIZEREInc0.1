import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimForm } from "@/components/reports/claim-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report } from "@shared/schema";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  ShieldCheck
} from "lucide-react";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showClaimForm, setShowClaimForm] = useState(false);

  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: [`/api/reports/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Report Not Found</h1>
          <p className="text-neutral-500 mb-6">The report you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/lost-found')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lost & Found
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === report.userId;
  const isFoundReport = report.type === 'found';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/lost-found')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lost & Found
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {report.imageUrls && report.imageUrls.length > 0 ? (
                <div className="grid gap-4">
                  {report.imageUrls.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      alt={`${report.title} - Image ${i + 1}`}
                      className="rounded-xl w-full h-64 object-cover shadow-lg border"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-100 rounded-xl h-64 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge 
                    variant={report.type === 'lost' ? 'destructive' : 'default'}
                    className={report.type === 'found' ? 'bg-green-600' : ''}
                  >
                    {report.type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                  <Badge variant="outline">{report.status}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900">{report.title}</h1>
                {report.receiptNumber && (
                  <p className="text-sm text-neutral-500 mt-1 font-mono">
                    Receipt: {report.receiptNumber}
                  </p>
                )}
              </div>

              {/* Info Cards */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-neutral-600">Date:</span>
                    <span className="font-medium">{format(new Date(report.date), 'MMMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-neutral-600">Location:</span>
                    <span className="font-medium">{report.location}</span>
                  </div>

                  {report.category && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-neutral-600">Category:</span>
                      <span className="font-medium">{report.category}</span>
                    </div>
                  )}

                  {report.type === 'lost' && report.contactInfo && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-neutral-600">Contact:</span>
                      <span className="font-medium">{report.contactInfo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-neutral-900 mb-2">Description</h3>
                  <p className="text-neutral-600 leading-relaxed">{report.description}</p>
                </CardContent>
              </Card>

              {/* Actions */}
              {!isOwner && isFoundReport && report.status === 'Open' && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    {!showClaimForm ? (
                      <div className="text-center">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold text-neutral-900 mb-2">Is this your item?</h3>
                        <p className="text-sm text-neutral-600 mb-4">
                          If you believe this item belongs to you, file a claim with proof of ownership.
                        </p>
                        <Button onClick={() => setShowClaimForm(true)} className="w-full">
                          File Ownership Claim
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-neutral-900">Claim Form</h3>
                          <Button variant="ghost" size="sm" onClick={() => setShowClaimForm(false)}>
                            Cancel
                          </Button>
                        </div>
                        <ClaimForm 
                          reportId={report.id} 
                          onSuccess={() => {
                            setShowClaimForm(false);
                            toast({ title: "Claim submitted successfully!" });
                            queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
                          }} 
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwner && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-5 text-center">
                    <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-700">You submitted this report</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
