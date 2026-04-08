import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, Package, Calendar, Tag, ShieldCheck, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface PublicItemInfo {
  name: string;
  category: string;
  status: string;
  isRegistered: boolean;
  registeredAt: string;
  isFlagged: boolean;
  description?: string;
  imageCount: number;
  source?: 'registry' | 'pos';
  retailerName?: string | null;
}

export default function PublicItemVerifyPage() {
  const { uniqueIdentifier } = useParams();

  const { data: item, isLoading, error } = useQuery<PublicItemInfo>({
    queryKey: [`/api/items/public/${uniqueIdentifier}`],
    queryFn: async () => {
      const res = await apiGet<PublicItemInfo>(`/api/items/public/${uniqueIdentifier}`);
      if (!res) throw new Error("Item not found");
      return res;
    },
    retry: false
  });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <div className="container px-4 py-12 max-w-2xl">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        <div className="container relative z-10 px-4 py-12 max-w-md text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl">
              <CardContent className="pt-10 pb-8 px-8">
                <div className="bg-destructive/10 text-destructive p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black tracking-tight mb-3">Record Not Found</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  This identifier is not recognized by the KIZERE global registry. The item may be counterfeit or unregistered.
                </p>
                <Button asChild variant="outline" className="w-full h-12 rounded-xl text-sm font-semibold">
                  <Link href="/">Return to Registry</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse [animation-duration:8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse [animation-duration:10s] [animation-delay:2s]" />
        {item.isFlagged && (
           <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-destructive/15 blur-[150px] animate-pulse [animation-duration:4s]" />
        )}
      </div>

      <div className="container relative z-10 mx-auto px-4 py-12 max-w-xl">
        <motion.div 
           initial="initial"
           animate="animate"
           variants={pageVariants}
           className="space-y-6"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
             <div className="inline-flex items-center justify-center gap-2 mb-4">
               <Fingerprint className="h-8 w-8 text-primary opacity-80" />
               <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                 KIZERE
               </h1>
             </div>
             <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Official Digital Certificate</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={`relative overflow-hidden border border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl ${item.isFlagged ? 'shadow-destructive/20' : 'shadow-primary/10'}`}>
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.isFlagged ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-primary'}`} />
              
              <CardHeader className="text-center pb-4 pt-10">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                >
                  {item.isFlagged ? (
                    <div className="relative mx-auto mb-6 w-24 h-24">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" />
                      <div className="relative bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-destructive/30">
                        <AlertTriangle className="h-10 w-10" />
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto mb-6 w-24 h-24 relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                      <div className="relative bg-gradient-to-br from-emerald-400 to-primary text-white rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-primary/30">
                        <ShieldCheck className="h-12 w-12" />
                      </div>
                    </div>
                  )}
                </motion.div>
                
                <CardTitle className="text-2xl md:text-3xl font-black tracking-tight">{item.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 mt-2 font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  {item.category}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6 pb-8 md:px-10 md:pb-10">
                <div className="flex justify-center">
                  {item.isFlagged ? (
                    <Badge variant="destructive" className="px-6 py-1.5 text-sm font-bold tracking-wide uppercase shadow-sm">
                      Flagged: Stolen / Lost
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-1.5 text-sm font-bold tracking-wide uppercase shadow-sm border-transparent">
                      Verified Identity
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-white/10 dark:border-white/5">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Registered Since</p>
                      <p className="font-semibold text-sm">{format(new Date(item.registeredAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-white/10 dark:border-white/5">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                        {item.source === 'pos' ? 'Sold By' : 'Registry'}
                      </p>
                      <p className="font-semibold text-sm">
                        {item.source === 'pos'
                          ? (item.retailerName || 'KIZERE Retailer')
                          : 'Lost & Found'}
                      </p>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <div className="bg-background/40 backdrop-blur-sm border border-border/30 p-5 rounded-2xl">
                    <p className="text-sm text-center text-foreground/80 leading-relaxed font-medium italic relative">
                      <span className="text-primary/40 text-4xl leading-none absolute -top-2 left-0">"</span>
                      {item.description}
                      <span className="text-primary/40 text-4xl leading-none absolute -bottom-6 right-0">"</span>
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {item.isFlagged ? (
                    <motion.div 
                      className="bg-destructive/10 border-2 border-destructive/20 p-6 rounded-2xl text-center relative overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-[40px]" />
                      <h3 className="font-black text-destructive/90 mb-2 uppercase tracking-wide text-sm flex justify-center items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Warning
                      </h3>
                      <p className="text-sm text-foreground/80 mb-5 font-medium relative z-10">
                        This asset has been reported as missing or stolen. Transactions involving this item may be strictly prohibited.
                      </p>
                      <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20" variant="destructive" asChild>
                        <Link href={`/report-found?identifier=${uniqueIdentifier}`}>
                          Report Found Item
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="text-center text-xs p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl font-medium text-emerald-800 dark:text-emerald-300/80">
                      <p className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        This item is cryptographically secured in the KIZERE global registry.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} className="text-center text-xs font-medium text-muted-foreground/60 tracking-wider">
            <p>© {new Date().getFullYear()} KIZERE INC. ALL RIGHTS RESERVED.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

