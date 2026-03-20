import * as React from "react";
import { Link, useParams } from "wouter";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Share2, Facebook, Twitter, Linkedin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";

// Mock data (moved to DB)
// const BLOG_POSTS: Record<string, any> = {...};

export default function BlogPostPage() {
  const { slug } = useParams();
  
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blogs/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

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
    "headline": post?.title,
    "image": [
      post?.image?.startsWith('http') ? post.image : `https://kizere.rw${post?.image || ''}`
    ],
    "datePublished": post ? new Date(post.publishedAt || post.createdAt).toISOString() : '',
    "author": [{
      "@type": "Person",
      "name": post.authorName || "KIZERE Team"
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
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                <p className="text-primary font-medium">{post.authorName || "KIZERE Team"}</p>
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
