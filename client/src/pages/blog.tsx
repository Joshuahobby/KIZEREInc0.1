import * as React from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";

// Mock data for initial MVP Blog
const BLOG_POSTS = [
  {
    id: "why-register-devices",
    title: "Why Registering Your Devices is Critical in Rwanda",
    excerpt: "Learn how the national registry protects you against theft and increases device resale value.",
    date: "2026-03-15",
    author: "KIZERE Security Team",
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
    category: "Security"
  },
  {
    id: "digital-passports-future",
    title: "Digital Passports: The Future of Item Ownership",
    excerpt: "Explore how blockchain and secure databases are providing immutable proof of ownership for high-value items.",
    date: "2026-03-10",
    author: "Tech Innovations",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    category: "Technology"
  },
  {
    id: "success-story-laptop-recovered",
    title: "Success Story: How a Student Recovered Their Stolen Laptop",
    excerpt: "A real-world example of how the KIZERE network helped reunite a university student with their essential device.",
    date: "2026-03-05",
    author: "Community Stories",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    category: "Success Stories"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="KIZERE Security Blog | News & Tips"
        description="Stay updated with the latest in item security, digital ownership, and recovery stories from the KIZERE community."
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              KIZERE <span className="text-primary">Blog</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, tips, and stories about securing your valuable items in the digital age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="h-full group cursor-pointer border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden bg-card/60 backdrop-blur-xl">
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-primary border border-primary/20">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center text-primary font-bold group-hover:translate-x-1 transition-transform">
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
