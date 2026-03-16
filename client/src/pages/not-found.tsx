import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home, Search, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden py-24">
        {/* Ambient Spatial Gallery Backgrounds */}
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px_32px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 w-full text-center">

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/20 dark:from-white dark:to-white/20 select-none drop-shadow-sm">
              404
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-primary/80" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
                Lost in space?
              </h2>
            </div>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto font-medium">
              We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Quick Action 1: Home */}
            <Link 
              href="/"
              className="group relative bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-lg hover:shadow-[0_0_40px_rgba(undefined,0.15)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-300 flex flex-col items-center text-center overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 delay-75">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Return Home</h3>
              <p className="text-sm text-muted-foreground font-medium">Head back to the main landing page to start fresh.</p>
            </Link>

            {/* Quick Action 2: Search */}
            <Link 
              href="/search"
              className="group relative bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-lg hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col items-center text-center overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 delay-75">
                <Search className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-500 transition-colors">Search Directory</h3>
              <p className="text-sm text-muted-foreground font-medium">Looking for something specific? Search the registry.</p>
            </Link>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
