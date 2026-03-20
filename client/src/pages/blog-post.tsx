import * as React from "react";
import { Link, useParams } from "wouter";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Share2, Facebook, Twitter, Linkedin } from "lucide-react";

// Mock data (same as blog.tsx for now, but with full content)
const BLOG_POSTS: Record<string, any> = {
  "why-register-devices": {
    id: "why-register-devices",
    title: "Why Registering Your Devices is Critical in Rwanda",
    excerpt: "Learn how the national registry protects you against theft and increases device resale value.",
    content: `
      <p>In today's digital age, our electronic devices are more than just tools—they hold our personal data, professional lives, and significant financial value.</p>
      <h2>The Rising Cost of Device Theft</h2>
      <p>Device theft remains a significant issue globally. Without a central registry, stolen devices can easily be wiped and resold on the secondary market with little risk to the thieves.</p>
      <h2>How KIZERE Changes the Game</h2>
      <p>By registering your device's unique identifiers (like IMEI and Serial Number) on KIZERE, you create a permanent, verifiable link between you and your property. If your device is ever lost or stolen, you can flag it instantly. This prevents buyers on the secondary market from unknowingly purchasing stolen goods and dramatically increases the chances of recovery by law enforcement.</p>
      <h2>Increased Resale Value</h2>
      <p>When you're ready to upgrade, transferring a verified KIZERE-registered item gives the buyer peace of mind, often allowing you to command a premium price compared to unregistered, unverifiable items.</p>
    `,
    date: "2026-03-15",
    author: "KIZERE Security Team",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
    category: "Security"
  }
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = slug ? BLOG_POSTS[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center flex-col">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <Link href="/blog">
            <Button variant="outline">Return to Blog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": [
      post.image.startsWith('http') ? post.image : `https://kizere.rw${post.image}`
    ],
    "datePublished": new Date(post.date).toISOString(),
    "author": [{
      "@type": "Person",
      "name": post.author
    }],
    "publisher": {
      "@type": "Organization",
      "name": "KIZERE",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kizere.rw/icons/icon-512x512.png"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title={`${post.title} | KIZERE Blog`}
        description={post.excerpt}
        image={post.image}
        type="article"
        schema={articleSchema}
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8 -ml-4 text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Button>
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground border-l-4 border-primary pl-4 py-2">
              {post.excerpt}
            </p>
          </header>

          <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl border border-white/5">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <div className="grid md:grid-cols-[1fr_200px] gap-12">
            <div 
              className="prose prose-lg dark:prose-invert prose-p:text-muted-foreground prose-headings:font-bold prose-headings:tracking-tight max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            <aside className="space-y-8">
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h3 className="font-bold text-lg mb-2">Written by</h3>
                <p className="text-primary font-medium">{post.author}</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5" /> Share
                </h3>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon" className="rounded-full hover:text-blue-500 hover:border-blue-500">
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full hover:text-sky-500 hover:border-sky-500">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full hover:text-indigo-600 hover:border-indigo-600">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
