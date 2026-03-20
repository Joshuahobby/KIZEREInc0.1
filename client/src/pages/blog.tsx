import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Calendar, Tag as TagIcon, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BlogPage() {
  const { t } = useLanguage();

  const posts = [
    {
      id: "post1",
      title: t('blog_page.posts.post1.title'),
      excerpt: t('blog_page.posts.post1.excerpt'),
      date: t('blog_page.posts.post1.date'),
      category: t('blog_page.posts.post1.category'),
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "post2",
      title: t('blog_page.posts.post2.title'),
      excerpt: t('blog_page.posts.post2.excerpt'),
      date: t('blog_page.posts.post2.date'),
      category: t('blog_page.posts.post2.category'),
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "post3",
      title: t('blog_page.posts.post3.title'),
      excerpt: t('blog_page.posts.post3.excerpt'),
      date: t('blog_page.posts.post3.date'),
      category: t('blog_page.posts.post3.category'),
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const categories = [
    t('blog_page.categories.all'),
    t('blog_page.categories.security'),
    t('blog_page.categories.success'),
    t('blog_page.categories.news')
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.h1
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('blog_page.title')}
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t('blog_page.subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-10">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input className="pl-10 h-12 rounded-xl" placeholder="Search articles..." />
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-bold text-lg mb-4">Categories</h3>
                <div className="flex flex-wrap lg:flex-col gap-2">
                  {categories.map((cat, i) => (
                    <button
                      key={i}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    className="group bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all hover:translate-y-[-4px]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        width={400}
                        height={250}
                        loading="lazy"
                        decoding="async"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-primary shadow-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </div>
                      </div>

                      <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                        {post.excerpt}
                      </p>

                      <button className="flex items-center gap-1 text-primary font-bold text-sm group/btn">
                        {t('blog_page.readMore')}
                        <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
