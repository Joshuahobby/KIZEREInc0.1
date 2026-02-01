import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { AuthService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userRoles } from "@shared/schema";
import { 
  Loader2,
  KeyRound, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Tag, 
  Search, 
  MapPin,
  Database,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { AuthModel } from "@/models/auth.model";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

// Use types from our authentication model
type LoginFormValues = z.infer<typeof AuthModel.loginSchema>;
type RegisterFormValues = z.infer<typeof AuthModel.registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isStrong: boolean; message: string; score: number } | null>(null);
  const { user, loginMutation, registerMutation, loginWithGoogle, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Use role-specific dashboard instead of landing page
      const dashboardPath = AuthService.getDashboardPathByRole(user.role);
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(AuthModel.loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(AuthModel.registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "Subscriber",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    const loginData = AuthModel.prepareLoginData(data);
    loginMutation.mutate(loginData);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const registerData = AuthModel.prepareRegisterData(data);
    registerMutation.mutate(registerData);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const featureItem = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center">
          {/* Hero Section with 3D-like UI */}
          <motion.div 
            className="lg:w-1/2 flex flex-col justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="relative mb-8">
              <motion.div 
                className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-primary/10 z-0"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, 0],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              />
              <motion.div 
                className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-secondary/10 z-0"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, -15, 0],
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  delay: 1 
                }}
              />
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground mb-4 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">KIZERE</span>
                <span className="block text-2xl md:text-3xl mt-2 text-foreground/90">Smart Item Management</span>
              </motion.h1>
            </div>
            
            <motion.p 
              className="text-lg text-muted-foreground mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              The modern digital solution to register, protect, track, and recover your valuable possessions with advanced technology.
            </motion.p>
            
            <motion.div 
              className="space-y-5"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="flex items-start" variants={featureItem}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <Database className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium text-foreground">Secure Registration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Register your valuable items in our encrypted database</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-start" variants={featureItem}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium text-foreground">Lost & Found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Report lost items and get notified when they're found</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-start" variants={featureItem}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium text-foreground">Smart Search</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Find items with our AI-powered search system</p>
                </div>
              </motion.div>
              
              <motion.div className="flex items-start" variants={featureItem}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-base font-medium text-foreground">Ownership Management</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Transfer and verify ownership with digital certificates</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Auth Forms with Glass Morphism */}
          <motion.div 
            className="lg:w-1/2 mt-8 lg:mt-0 w-full max-w-md"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="backdrop-blur-sm bg-card/80 border border-border/40 shadow-xl">
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="text-sm">Create Account</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Form */}
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Enter your username" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <Input 
                                    className="pl-10 pr-10" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-2.5 text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-between items-center mt-2 mb-1">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="remember" 
                              className="rounded border-input h-4 w-4 text-primary focus:ring-primary"
                            />
                            <label htmlFor="remember" className="text-sm text-muted-foreground">
                              Remember me
                            </label>
                          </div>
                          <a href="#" className="text-sm text-primary hover:underline">
                            Forgot password?
                          </a>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-4" 
                          disabled={loginMutation.isPending}
                          size="lg"
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>

                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/60"></span>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>

                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full h-12 border-border/60 hover:bg-muted/50 transition-all duration-300"
                          onClick={() => loginWithGoogle()}
                          disabled={authLoading || loginMutation.isPending}
                        >
                          <SiGoogle className="mr-3 h-4 w-4 text-[#4285F4]" />
                          Sign in with Google
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* Registration Form */}
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Enter your full name" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Email or Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Enter your email or phone (+250...)" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground/80">Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                      className="pl-10 pr-10" 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="Create a password" 
                                      {...field} 
                                      onChange={(e) => {
                                        field.onChange(e);
                                        if (e.target.value) {
                                          setPasswordStrength(AuthModel.validatePasswordStrength(e.target.value));
                                        } else {
                                          setPasswordStrength(null);
                                        }
                                      }}
                                    />
                                    <button 
                                      type="button"
                                      className="absolute right-3 top-2.5 text-muted-foreground"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                                <PasswordStrengthIndicator score={passwordStrength?.score || 0} maxScore={5} />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                      className="pl-10 pr-10" 
                                      type={showConfirmPassword ? "text" : "password"} 
                                      placeholder="Confirm your password" 
                                      {...field} 
                                    />
                                    <button 
                                      type="button"
                                      className="absolute right-3 top-2.5 text-muted-foreground"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Role is automatically set to Subscriber for public registration */}
                        {/* Admin and Agent roles can only be assigned by administrators */}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <input 
                            type="checkbox" 
                            id="terms" 
                            className="rounded border-input h-4 w-4 text-primary focus:ring-primary"
                          />
                          <label htmlFor="terms" className="text-sm text-muted-foreground">
                            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                          </label>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-4"
                          disabled={registerMutation.isPending}
                          size="lg"
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}