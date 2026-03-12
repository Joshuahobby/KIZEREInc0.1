import * as React from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useLocation } from "wouter";

// Icons 
import {
  ShieldCheck,
  BellRing,
  DollarSign
} from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { LoadingOverlay } from "@/components/ui/loading-overlay";
// Optional: import { ClaimReviewDialog } from "@/components/claims/claim-review-dialog"; if it gets extracted, otherwise omit for now.


export default function MyClaims() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [selectedClaim, setSelectedClaim] = React.useState<any | null>(null);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  const dashboardData = useDashboardData();
  const {
    myClaims = [],
    claimsReceived = [],
    isLoading = true
  } = dashboardData || {};

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };


  if (isLoading) {
      return (
          <AppLayout>
              <LoadingOverlay alwaysShow={true} />
          </AppLayout>
      )
  }

  return (
    <ErrorBoundary>
      <AppLayout>
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
        >
        
        {/* Ambient background glows for Premium Dark Mode */}
        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 hidden dark:block" />
        <div className="fixed bottom-0 left-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10 hidden dark:block" />

        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('dashboard.tabs.claims') || 'Claims'}</h1>
            <p className="text-muted-foreground mt-1">Manage your filed claims and claims against your items.</p>
        </div>
        
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="visible"
        >
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>{t('dashboard.myClaims')}</CardTitle>
                  </div>
                  <CardDescription>{t('dashboard.claimsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {myClaims.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('dashboard.table.claimId')}</TableHead>
                          <TableHead>{t('dashboard.table.status')}</TableHead>
                          <TableHead>{t('dashboard.table.date')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myClaims.map((claim: any) => (
                          <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/claims/${claim.id}`)}>
                            <TableCell className="font-mono text-xs">#{claim.id}</TableCell>
                            <TableCell>
                              <Badge variant={claim.status === 'pending' ? 'outline' : 'secondary'}>
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{format(new Date(claim.createdAt), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground italic">{t('dashboard.noClaimsFiled')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-primary" />
                    <CardTitle>{t('dashboard.claimsReceived')}</CardTitle>
                  </div>
                  <CardDescription>{t('dashboard.claimsReceivedDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsReceived.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('dashboard.table.from')}</TableHead>
                          <TableHead>{t('dashboard.table.status')}</TableHead>
                          <TableHead>{t('dashboard.table.action')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claimsReceived.map((claim: any) => (
                          <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/claims/${claim.id}`)}>
                            <TableCell className="text-xs">User #{claim.userId}</TableCell>
                            <TableCell>
                              <Badge variant={claim.status === 'pending' ? 'outline' : 'secondary'}>
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/claims/${claim.id}`);
                                }}
                              >
                                {t('dashboard.review')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground italic">{t('dashboard.noClaimsReceived')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
        
        </motion.div>
      </AppLayout>
    </ErrorBoundary>
  );
}
