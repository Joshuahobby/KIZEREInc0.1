import * as React from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Search, 
  MapPin, 
  Building2, 
  Plane, 
  ShieldCheck, 
  Store,
  ArrowRight
} from "lucide-react";

export default function UseCasesPage() {
  const personas = [
    {
      id: "owners",
      icon: <Search className="w-8 h-8 text-blue-500" />,
      title: "The Distressed Owner (Lost Item)",
      description: "Recover a lost item as quickly and securely as possible. Search our real-time database, file a detailed loss report, and securely claim matches when a Good Samaritan reports finding your property.",
      image: "/images/localized/use-case-owner.png",
      color: "from-blue-500/20 to-transparent",
      features: ["Immediate matching", "Secure identity verification", "Safe communication"]
    },
    {
      id: "finders",
      icon: <MapPin className="w-8 h-8 text-emerald-500" />,
      title: "The Good Samaritan (Found Item)",
      description: "Safely return a found item to its rightful owner. Report what you've found (like a phone left in a taxi) and the system automatically matches it with distraught owners looking for it.",
      image: "/images/localized/use-case-finder.png",
      color: "from-emerald-500/20 to-transparent",
      features: ["Anonymous reporting", "Moderated handoffs", "Community reward eligibility"]
    },
    {
      id: "businesses",
      icon: <Building2 className="w-8 h-8 text-purple-500" />,
      title: "Subscribers & Businesses (Hotels/Events)",
      description: "Manage lost and found efficiently for your venue. Batch upload items left behind at conferences, hotels, or airports to help guests recover them instantly without physical logbooks.",
      image: "/images/localized/use-case-business.png",
      color: "from-purple-500/20 to-transparent",
      features: ["Batch item uploading", "Premium visibility", "Dashboard analytics"]
    },
    {
      id: "travelers",
      icon: <Plane className="w-8 h-8 text-amber-500" />,
      title: "Tourists & Travelers",
      description: "Protect your valuables while exploring Rwanda. Pre-register your laptops, cameras, and passports so that if anything is lost during transit or tours, you are instantly contactable.",
      image: "/images/localized/use-case-traveler.png",
      color: "from-amber-500/20 to-transparent",
      features: ["Temporary registrations", "International contact binding", "Flight/Transit tracking"]
    },
    {
      id: "retailers",
      icon: <Store className="w-8 h-8 text-rose-500" />,
      title: "Electronics Retailers",
      description: "Enhance customer trust by registering devices directly at the point of sale. Provide your customers with a secure 'Digital Passport' for their new smartphones or laptops the moment they walk out the door.",
      image: "/images/localized/use-case-retailer.png",
      color: "from-rose-500/20 to-transparent",
      features: ["API POS integration", "Instant digital receipts", "Increased customer loyalty"]
    },
    {
      id: "insurance",
      icon: <ShieldCheck className="w-8 h-8 text-cyan-500" />,
      title: "Insurance Companies",
      description: "Streamline the claims process. Verify the existence, ownership, and 'lost' status of highly valuable assets such as jewelry and professional equipment before paying out claims.",
      image: "/images/localized/use-case-insurance.png",
      color: "from-cyan-500/20 to-transparent",
      features: ["Fraud prevention", "Status verification API", "Immutable audit trails"]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Who is KIZERE For? | Real Use Cases"
        description="Whether you've lost a phone, found a wallet, or run a hotel, discover how KIZERE connects people to secure and recover items."
      />
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
            Platform Roles
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Connecting People, <br/><span className="text-gradient">Protecting Assets</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            The KIZERE registry thrives on community and security. See how different users engage with our platform to tackle the global problem of lost and stolen property.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {personas.map((persona, index) => (
              <Card key={persona.id} className="overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-500 bg-card/40 backdrop-blur-sm flex flex-col">
                <div className="relative h-64 w-full overflow-hidden shrink-0">
                  <img 
                    src={persona.image} 
                    alt={persona.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${persona.color} opacity-80`} />
                  <div className="absolute bottom-6 left-6 p-3 bg-background/90 backdrop-blur-md rounded-2xl shadow-lg">
                    {persona.icon}
                  </div>
                </div>
                
                <CardContent className="p-8 flex-grow flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">{persona.title}</h3>
                  <p className="text-muted-foreground mb-8 text-lg flex-grow">
                    {persona.description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Key Features</h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {persona.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/auth">
                    <Button variant="outline" className="w-full sm:w-fit rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
