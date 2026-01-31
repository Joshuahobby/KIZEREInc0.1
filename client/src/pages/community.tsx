import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, Share2, ShieldCheck, MessageSquare, Award, Flame, ShieldAlert, CheckCircle2, MoreHorizontal, ThumbsUp, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CommunityPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [isJoined, setIsJoined] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "success" });

  const rules = [
    { text: t('community_page.guidelines.rule1'), icon: ShieldCheck },
    { text: t('community_page.guidelines.rule2'), icon: Heart },
    { text: t('community_page.guidelines.rule3'), icon: Share2 }
  ];

  const communityStats = [
    { label: "Active Members", value: "1,240+", icon: Users, color: "text-blue-500" },
    { label: "Items Recovered", value: "312", icon: CheckCircle2, color: "text-green-500" },
    { label: "Security Alerts", value: "24", icon: ShieldAlert, color: "text-red-500" },
    { label: "Trust Score", value: "4.9/5", icon: Award, color: "text-yellow-500" },
  ];

  const badges = [
    { name: t('community_page.badges.eagle_eye'), icon: Flame, color: "bg-orange-500/10 text-orange-600" },
    { name: t('community_page.badges.trust_builder'), icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600" },
    { name: t('community_page.badges.recovery_expert'), icon: Award, color: "bg-green-500/10 text-green-600" },
  ];

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Emmanuel K.",
      category: "success",
      title: "Recovered my Laptop in Remera!",
      content: "A huge thanks to the KIZERE community. My laptop was found by a stranger who scanned my QR tag. Trust works!",
      likes: 42,
      comments: 7,
      time: "2h ago",
      initials: "EK",
      liked: false
    },
    {
      id: 2,
      author: "Security Desk",
      category: "security",
      title: "New Phishing Attempt Alert",
      content: "Be careful of SMS messages asking for delivery fees for 'found' items. KIZERE will only notify you via app/email.",
      likes: 89,
      comments: 15,
      time: "5h ago",
      initials: "SD",
      liked: false
    },
    {
      id: 3,
      author: "Marie Claire",
      category: "tips",
      title: "How to tag your keys effectively",
      content: "I've found that placing the tag inside the leather pouch is better for durability. Here's how I did it...",
      likes: 24,
      comments: 3,
      time: "1d ago",
      initials: "MC",
      liked: false
    }
  ]);

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) return;
    
    const post = {
      id: posts.length + 1,
      author: "You",
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
      likes: 0,
      comments: 0,
      time: "Just now",
      initials: "ME",
      liked: false
    };
    
    setPosts([post, ...posts]);
    setIsDialogOpen(false);
    setNewPost({ title: "", content: "", category: "success" });
    toast({
      title: "Post Created",
      description: "Your story has been shared with the community.",
    });
  };

  const filteredPosts = posts
    .filter(p => activeTab === "all" || p.category === activeTab)
    .filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        {/* Banner Section */}
        <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6"
            >
              <Users className="h-4 w-4" />
              <span>Building Trust Together</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('community_page.title')}
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t('community_page.subtitle')}
            </motion.p>
          </div>
        </section>

        {/* Community Stats */}
        <section className="py-12 border-b bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {communityStats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4">
                  <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Feed */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">{t('community_page.feed.title')}</h2>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                        {t('community_page.create_post')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>{t('community_page.create_post')}</DialogTitle>
                        <DialogDescription>
                          Share your experiences or safety tips with other KIZERE members.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Category</label>
                          <div className="flex gap-2">
                            {["success", "security", "tips"].map((cat) => (
                              <Button
                                key={cat}
                                variant={newPost.category === cat ? "default" : "outline"}
                                size="sm"
                                className="capitalize rounded-full"
                                onClick={() => setNewPost({ ...newPost, category: cat })}
                              >
                                {cat}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title</label>
                          <Input 
                            placeholder="Enter a descriptive title..." 
                            value={newPost.title}
                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Content</label>
                          <Textarea 
                            placeholder="What would you like to share?" 
                            className="min-h-[120px] rounded-xl"
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleCreatePost} className="rounded-xl">Post to Community</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mb-6">
                  <Input 
                    placeholder="Search community stories and alerts..." 
                    className="rounded-xl bg-card border-muted-foreground/20 focus:border-primary shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg">{t('community_page.feed.filter_all')}</TabsTrigger>
                    <TabsTrigger value="success" className="rounded-lg">Success</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg">Security</TabsTrigger>
                    <TabsTrigger value="tips" className="rounded-lg">Tips</TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <div className="space-y-6">
                      {filteredPosts.length > 0 ? (
                        filteredPosts.map((post, i) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <AvatarWithInitials name={post.author} className="h-10 w-10 border-2 border-primary/10" />
                                <div>
                                  <p className="font-semibold text-sm">{post.author}</p>
                                  <p className="text-xs text-muted-foreground">{post.time}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {post.category}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-6 pt-4 border-t">
                              <button 
                                onClick={() => handleLike(post.id)}
                                className={cn(
                                  "flex items-center gap-2 text-sm transition-colors",
                                  post.liked ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
                                )}
                                aria-label={post.liked ? "Unlike post" : "Like post"}
                              >
                                <ThumbsUp className={cn("h-4 w-4", post.liked && "fill-current")} />
                                <span>{post.likes}</span>
                              </button>
                              <button 
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                aria-label="View comments"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.comments}</span>
                              </button>
                              <button 
                                className="ml-auto text-muted-foreground hover:text-foreground"
                                aria-label="More options"
                                title="More options"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                          <p className="text-muted-foreground font-medium">No posts found matching your criteria.</p>
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                </Tabs>
              </div>

              {/* Right Column: Sidebar */}
              <div className="space-y-8">
                {/* Guidelines */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t('community_page.guidelines.title')}
                  </h3>
                  <div className="space-y-4">
                    {rules.map((rule, i) => (
                      <div key={i} className="flex gap-3">
                        <rule.icon className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-sm font-medium">{rule.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges Preview */}
                <div className="bg-card border rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    {t('community_page.badges.title')}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {badges.map((badge, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${badge.color}`}>
                        <badge.icon className="h-5 w-5" />
                        <span className="text-sm font-bold">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card border rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Live Activity
                  </h3>
                  <div className="space-y-4">
                    {[
                      { user: "Kamil M.", action: "liked a success story", time: "2m ago" },
                      { user: "Sarah B.", action: "joined the community", time: "15m ago" },
                      { user: "David R.", action: "shared a security tip", time: "45m ago" },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <span className="font-bold">{activity.user}</span> {activity.action}
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Recognition */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold mb-2">Eagle Eye of Kigali</h3>
                    <p className="text-sm text-gray-300 mb-4">Recognizing our most vigilant community member this month.</p>
                    <div className="flex items-center gap-2">
                      <AvatarWithInitials name="Jean Bosco" className="h-8 w-8" />
                      <span className="text-xs font-bold font-display">Jean Bosco M.</span>
                    </div>
                  </div>
                  <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5" />
                </div>

                {/* Join Movement CTA */}
                {!isJoined && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-accent rounded-2xl p-6 text-center shadow-inner"
                  >
                    <Heart className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="font-bold mb-2">Join the Movement</h3>
                    <p className="text-sm text-muted-foreground mb-6">Support the culture of trust in Rwanda.</p>
                    <Button 
                      className="w-full rounded-xl yellow-button font-bold"
                      onClick={() => {
                        setIsJoined(true);
                        toast({
                          title: "Welcome!",
                          description: "You are now a part of the KIZERE Trust Network.",
                        });
                      }}
                    >
                      Verify as Contributor
                    </Button>
                  </motion.div>
                )}
                {isJoined && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                    <h3 className="font-bold text-emerald-700">Verified Member</h3>
                    <p className="text-sm text-emerald-600/80">Thank you for helping keep Rwanda secure!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
