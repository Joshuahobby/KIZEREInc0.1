import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, Loader2, ShieldCheck, ShieldAlert, FileSearch, ArrowRight, User as UserIcon, Phone, AlertCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SearchResponse {
  status: 'found' | 'not_found' | 'error';
  item?: {
    status: string;
    name: string;
    category: string;
  };
  owner?: {
    name: string;
    phone: string;
  };
  message?: string;
}

export default function PublicSearch() {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: result, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: [`/api/public/items/search?query=${searchQuery}`],
    enabled: !!searchQuery,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  return (
    <PageLayout hideSidebar={true}>
      <SEO 
        title="Verify Item - KIZERE"
        description="Verify an item's status before buying. Check if it's reported lost, stolen, or clean on KIZERE."
      />
      <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-background to-background/50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl text-center space-y-4 mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mx-auto mb-4">
            <ShieldCheck className="w-5 h-5" />
            <span>Identity & Ownership Verification</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Verify Item Status
          </h1>
          <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
            Protect yourself from buying stolen goods. Enter an item's Unique ID or Serial Number to check its status on KIZERE.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl relative z-10"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors duration-500"></div>
            <div className="relative flex items-center bg-card rounded-2xl shadow-xl border-2 border-primary/20 p-2 overflow-hidden">
              <Search className="w-6 h-6 text-muted-foreground ml-3" />
              <Input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter IMEI, Serial Number, or KIZERE ID..." 
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg h-14"
              />
              <Button type="submit" size="lg" className="rounded-xl h-12 px-8 font-bold" disabled={isLoading || !searchInput.trim()}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </form>
        </motion.div>

        <div className="w-full max-w-2xl mt-12 relative min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-primary space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">Searching KIZERE Database...</p>
            </div>
          )}

          {!isLoading && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {result.status === 'found' && result.item && result.owner && (
                <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden bg-card/60 backdrop-blur-xl">
                  {/* Status Banner */}
                  {(() => {
                    const isAlert = result.item.status === 'Lost' || result.item.status === 'Stolen';
                    const isClean = result.item.status === 'Registered' || result.item.status === 'Clean';
                    
                    if (isAlert) {
                      return (
                        <div className="bg-destructive text-destructive-foreground p-4 flex items-center justify-center gap-3">
                          <ShieldAlert className="w-6 h-6" />
                          <h2 className="text-xl font-black uppercase tracking-wider">Warning: Item Reported {result.item.status}</h2>
                        </div>
                      );
                    } else if (isClean) {
                      return (
                        <div className="bg-emerald-500 text-white p-4 flex items-center justify-center gap-3">
                          <ShieldCheck className="w-6 h-6" />
                          <h2 className="text-xl font-black uppercase tracking-wider">Item is Clean</h2>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-blue-500 text-white p-4 flex items-center justify-center gap-3">
                          <AlertCircle className="w-6 h-6" />
                          <h2 className="text-xl font-black uppercase tracking-wider">Status: {result.item.status}</h2>
                        </div>
                      );
                    }
                  })()}

                  <CardContent className="p-6 sm:p-8 space-y-8">
                    <div className="text-center space-y-2 mt-4">
                      <h3 className="text-2xl font-bold">{result.item.name}</h3>
                      <span className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {result.item.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-2xl border border-border/50">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <UserIcon className="w-5 h-5 text-primary" />
                          <span className="font-medium uppercase text-xs tracking-wider">Registered Owner</span>
                        </div>
                        <p className="text-lg font-bold">{result.owner.name}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Phone className="w-5 h-5 text-primary" />
                          <span className="font-medium uppercase text-xs tracking-wider">Contact Number</span>
                        </div>
                        <p className="text-lg font-bold tracking-widest">{result.owner.phone}</p>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-amber-600 dark:text-amber-500">
                      <Shield className="w-5 h-5 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">
                        <strong>Security Tip:</strong> Ensure the person selling or holding this item matches the registered owner details shown above. If the details do not match, this device might not belong to this person.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.status === 'not_found' && (
                <Card className="border-border shadow-xl bg-card border-dashed">
                  <CardContent className="p-10 flex flex-col items-center text-center space-y-6 mt-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                      <FileSearch className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black">{result.message || "Item Not Found"}</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        This item is not currently protected by the KIZERE registry. It may not be registered yet.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 group hover:shadow-primary/30 text-white font-bold">
                        <Link href="/register-item">
                          Register That Instantly
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {!isLoading && isError && (
             <div className="text-center text-destructive p-8 bg-destructive/10 rounded-2xl border border-destructive/20 text-lg font-medium">
               An error occurred while verifying the item. Please try again later.
             </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
