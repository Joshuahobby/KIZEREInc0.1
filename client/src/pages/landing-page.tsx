import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Users, 
  BarChart, 
  Calendar
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentDate);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="text-2xl font-display font-bold text-primary">KIZERE</div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => navigate("/auth")} 
                className="font-medium text-foreground/80 hover:text-primary"
              >
                Login
              </button>
              <Button onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="text-gradient">Secure Your</span><br />
                <span className="text-gradient">Valuables Digitally</span>
              </h1>
              <p className="mt-6 text-lg text-gray-700">
                KIZERE is the ultimate platform for registering, tracking, and recovering your precious belongings.
                Never worry about lost items again.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate("/auth")}
                  className="yellow-button"
                >
                  Register Now
                </button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>
              
              <p className="mt-4 text-sm text-gray-500">
                Today is {formattedDate}
              </p>
            </motion.div>
            
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -left-6 -top-6 w-64 h-64 bg-primary-100 rounded-full opacity-50 filter blur-3xl"></div>
                <div className="absolute -right-6 -bottom-6 w-64 h-64 bg-[var(--yellow-light)] rounded-full opacity-50 filter blur-3xl"></div>
                
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-semibold text-gray-800">Item Registration</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Registered</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">iPhone 14 Pro</h4>
                        <p className="text-sm text-gray-500 mt-1">Serial: IMEI493049302939</p>
                        <p className="text-sm text-gray-500">Registered on April 10, 2025</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-primary-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Secure Digital Certificate</span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              The Complete Solution for <span className="text-gradient">Item Management</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              KIZERE provides all the tools you need to register, protect, and recover your valuable possessions.
            </p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Registration</h3>
              <p className="text-gray-600">
                Register your items securely with detailed information, photos, and unique identifiers.
              </p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lost Item Reporting</h3>
              <p className="text-gray-600">
                Quickly report lost items and get notified when they're found by someone in the community.
              </p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <Search className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Search</h3>
              <p className="text-gray-600">
                Search through our comprehensive database to find lost items or check if found items have been reported.
              </p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Access</h3>
              <p className="text-gray-600">
                Access your digital inventory anytime, anywhere from any device with our responsive platform.
              </p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Network</h3>
              <p className="text-gray-600">
                Connect with a community committed to helping each other recover lost possessions.
              </p>
            </motion.div>
            
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-6">
                <BarChart className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Intuitive Dashboard</h3>
              <p className="text-gray-600">
                Track your registered items, lost reports, and recovery progress through a user-friendly dashboard.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Secure Your Valuables?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-primary-100">
            Join thousands of users who trust KIZERE to keep track of their important possessions.
          </p>
          <button 
            onClick={() => navigate("/auth")}
            className="yellow-button text-lg px-8 py-4"
          >
            Create Free Account
          </button>
          <p className="mt-4 text-primary-200">No credit card required. Get started in minutes.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from people who have successfully recovered their lost items with KIZERE.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-lg">JM</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">James Mutembei</h4>
                  <p className="text-sm text-gray-500">Nairobi, Kenya</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "I lost my laptop at the airport and thought it was gone forever. Thanks to KIZERE, someone found it and contacted me within hours!"
              </p>
              <div className="mt-4 flex text-primary-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-lg">FN</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Florence Nkatha</h4>
                  <p className="text-sm text-gray-500">Mombasa, Kenya</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "The registration process was so simple! I've cataloged all my electronics and jewelry. Now I feel much more secure about my valuables."
              </p>
              <div className="mt-4 flex text-primary-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-lg">RK</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Robert Kabugi</h4>
                  <p className="text-sm text-gray-500">Nakuru, Kenya</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "I found someone's wallet and used KIZERE to locate the owner. The platform made it easy to connect and return the wallet safely."
              </p>
              <div className="mt-4 flex text-primary-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">15,000+</div>
              <p className="text-gray-600">Items Registered</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1,230+</div>
              <p className="text-gray-600">Items Recovered</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">8,500+</div>
              <p className="text-gray-600">Happy Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">98%</div>
              <p className="text-gray-600">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about KIZERE's platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                How secure is my information?
              </h3>
              <p className="text-gray-600">
                We use industry-standard encryption and security protocols to protect your data. 
                Your information is only visible to you and authorized personnel in case of a recovery scenario.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                What items can I register?
              </h3>
              <p className="text-gray-600">
                You can register any valuable items including electronics, jewelry, documents, vehicles, 
                accessories, and more. Any item with a unique identifier or distinguishing characteristics.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                How does the lost and found system work?
              </h3>
              <p className="text-gray-600">
                When you report a lost item, it's added to our database. If someone finds an item, they can report it, 
                and our system will automatically match it with lost reports and notify the owner.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Is there a limit to how many items I can register?
              </h3>
              <p className="text-gray-600">
                Basic accounts can register up to 10 items. Premium accounts have unlimited registration capacity 
                and additional features like priority support and advanced analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">KIZERE</h3>
              <p className="text-gray-400">
                The ultimate platform for item registration, lost and found management, and ownership protection.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">support@kizere.com</li>
                <li className="text-gray-400">+254 712 345 678</li>
                <li className="text-gray-400">Nairobi, Kenya</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Social Media</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} KIZERE, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}