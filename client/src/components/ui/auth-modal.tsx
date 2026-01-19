import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiGoogle } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  KeyRound, 
  Loader2, 
  Phone, 
  Shield, 
  ShieldCheck, 
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
import { useAuth, AuthContextType } from "@/hooks/use-auth";
import { AuthService } from "@/services/auth.service";
import { AuthModel } from "@/models/auth.model";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

type LoginFormValues = z.infer<typeof AuthModel.loginSchema>;
type RegisterFormValues = z.infer<typeof AuthModel.registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isStrong: boolean; message: string; score: number } | null>(null);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Use try-catch to handle potential auth context issues
  let auth: AuthContextType;
  try {
    auth = useAuth();
  } catch (error) {
    console.error("[AuthModal] Failed to access auth context:", error);
    auth = {
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      loginMutation: { mutateAsync: async () => {} },
      registerMutation: { mutateAsync: async () => {} },
      logoutMutation: { mutateAsync: async () => {} },
      loginWithGoogle: async () => { throw new Error("Auth context not available") },
      signOut: async () => { throw new Error("Auth context not available") },
    };
  }
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    } else {
      loginForm.reset();
      registerForm.reset();
      setPasswordStrength(null);
    }
  }, [isOpen, defaultTab]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(AuthModel.loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(AuthModel.registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const loginData = AuthModel.prepareLoginData(data);
      
      await auth.loginMutation.mutateAsync({
        username: loginData.username,
        password: loginData.password
      });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error?.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      const registerData = AuthModel.prepareRegisterData(data);
      
      await auth.registerMutation.mutateAsync({
        username: registerData.username,
        password: registerData.password,
        fullName: registerData.fullName
      });
      
      toast({
        title: "Account created!",
        description: "You have successfully created an account",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error?.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      const currentPath = window.location.pathname;
      const redirectUrl = currentPath === '/' ? '/dashboard' : currentPath;
      
      localStorage.setItem('auth_source', 'auth_modal');
      
      toast({
        title: "Google Authentication",
        description: "A popup window will open for authentication.",
        duration: 5000,
      });
      
      await auth.loginWithGoogle(redirectUrl);
      onClose();
    } catch (error: any) {
      console.error("[AuthModal] Google sign-in failed:", error);
      
      let errorTitle = "Sign in failed";
      let errorMessage = error?.message || "Failed to authenticate with Google";
      
      if (error?.code === 'auth/popup-closed-by-user' || errorMessage.includes('popup')) {
        errorTitle = "Authentication Window Closed";
        errorMessage = "The authentication window was closed. Please try again.";
      } else if (error?.code === 'auth/unauthorized-domain') {
        errorTitle = "Domain Not Authorized";
        errorMessage = "This domain is not authorized. Please contact the administrator.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
      
      setGoogleLoading(false);
    }
  };

  const features = [
    { icon: Shield, text: "Bank-level security" },
    { icon: CheckCircle2, text: "Instant verification" },
    { icon: Sparkles, text: "AI-powered protection" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] md:max-w-[900px] p-0 rounded-2xl overflow-hidden max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/30">
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">
          {activeTab === "login" ? "Login to your account" : "Create a new account"}
        </DialogDescription>
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex flex-col md:flex-row">
          {/* LEFT SIDE - Branding & Google */}
          <div className="md:w-2/5 bg-gradient-to-br from-primary via-primary to-primary/80 p-6 md:p-8 text-white relative overflow-hidden">
            {/* Decorative patterns */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-pattern-white" />
            </div>
            
            <div className="relative z-10">
              {/* Logo */}
              <motion.div 
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">KIZERE</span>
              </motion.div>
              
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {activeTab === "login" ? "Welcome Back!" : "Join Us Today"}
                </h2>
                <p className="text-white/80 text-sm mb-6">
                  {activeTab === "login" 
                    ? "Access your secured items and protection features" 
                    : "Start protecting your valuables in minutes"}
                </p>
              </motion.div>
              
              {/* Features list */}
              <motion.div 
                className="space-y-3 mb-8 hidden md:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  >
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-white/90">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Google Sign-in Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <p className="text-xs text-white/70 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recommended
                </p>
                <Button 
                  type="button" 
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12 font-medium group"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <SiGoogle className="h-5 w-5 mr-3" />
                      Continue with Google
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* RIGHT SIDE - Forms */}
          <div className="md:w-3/5 p-6 md:p-8">
            {/* Mobile divider */}
            <div className="md:hidden relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1.5 rounded-xl">
                <TabsTrigger 
                  value="login" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                {/* Login Form */}
                <TabsContent value="login" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Username / Phone / Email</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input 
                                    className="pl-10 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                    placeholder="Enter your username or email" 
                                    {...field} 
                                  />
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
                              <FormLabel className="text-sm font-medium">Password</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input 
                                    className="pl-10 pr-12 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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

                        <div className="flex justify-between items-center text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded border-muted-foreground/30 h-4 w-4 text-primary focus:ring-primary/20"
                            />
                            <span className="text-muted-foreground">Remember me</span>
                          </label>
                          <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Forgot password?
                          </a>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-12 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>
                  
                {/* Registration Form */}
                <TabsContent value="register" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input 
                                    className="pl-10 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                    placeholder="Enter your full name" 
                                    {...field} 
                                  />
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
                              <FormLabel className="text-sm font-medium">Phone or Email</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input 
                                    className="pl-10 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                    placeholder="+250 xxx xxx xxx or email" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Password</FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                      className="pl-10 pr-10 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="Create password" 
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
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                      className="pl-10 pr-10 h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-all" 
                                      type={showConfirmPassword ? "text" : "password"} 
                                      placeholder="Confirm password" 
                                      {...field} 
                                    />
                                    <button 
                                      type="button"
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <PasswordStrengthIndicator score={passwordStrength?.score || 0} maxScore={5} />

                        <label className="flex items-start gap-2 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            className="rounded border-muted-foreground/30 h-4 w-4 text-primary focus:ring-primary/20 mt-0.5"
                          />
                          <span className="text-muted-foreground leading-tight">
                            I agree to the <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
                          </span>
                        </label>

                        <Button 
                          type="submit" 
                          className="w-full h-12 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}