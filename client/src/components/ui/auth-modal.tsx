import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AuthModel } from "@/models/auth.model";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { signInWithGoogle, extractUserInfo } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck 
} from "lucide-react";
import { SiGoogle } from "react-icons/si";

// Function to redirect to appropriate dashboard based on user role
function redirectToDashboardByRole(role: string): void {
  const dashboardPath = getDashboardPathByRole(role);
  window.location.href = dashboardPath;
}

// Helper function to get the dashboard path based on user role
function getDashboardPathByRole(role: string): string {
  switch (role) {
    case 'Admin':
      return '/user-management';
    case 'Agent':
      return '/lost-found';
    case 'Subscriber':
    default:
      return '/dashboard';
  }
}

// Types from AuthModel
type LoginFormValues = z.infer<typeof AuthModel.loginSchema>;
type RegisterFormValues = z.infer<typeof AuthModel.registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isStrong: boolean; message: string } | null>(null);
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    } else {
      // Reset forms when modal closes
      loginForm.reset();
      registerForm.reset();
      setPasswordStrength(null);
    }
  }, [isOpen, defaultTab]);

  // Close modal when login/register is successful
  useEffect(() => {
    if (loginMutation.isSuccess || registerMutation.isSuccess) {
      onClose();
    }
  }, [loginMutation.isSuccess, registerMutation.isSuccess, onClose]);

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
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    const loginData = AuthModel.prepareLoginData(data);
    loginMutation.mutate(loginData, {
      onSuccess: (userData) => {
        // Redirect to the appropriate dashboard based on user role
        redirectToDashboardByRole(userData.role);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const registerData = AuthModel.prepareRegisterData(data);
    registerMutation.mutate(registerData, {
      onSuccess: (userData) => {
        // Redirect to the appropriate dashboard based on user role
        redirectToDashboardByRole(userData.role);
      }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      // Start Google sign-in process
      setGoogleLoading(true);
      const result = await signInWithGoogle();
      
      // Extract user information from Firebase result
      const userInfo = extractUserInfo(result);
      console.log("Google sign-in successful", userInfo);
      
      // Send the Google auth data to our backend
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.displayName,
          uid: userInfo.uid,
          token: userInfo.token,
          photoURL: userInfo.photoURL
        }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to authenticate with Google");
      }
      
      // Process the user data returned from our backend
      const userData = await response.json();
      
      // Update auth context
      queryClient.setQueryData(["/api/user"], userData);
      
      // Show success message
      toast({
        title: "Sign in successful",
        description: `Welcome, ${userData.fullName || userData.username}!`,
      });
      
      // Close the modal
      onClose();
      
      // Redirect to the appropriate dashboard based on user role
      redirectToDashboardByRole(userData.role);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[550px] overflow-y-auto max-h-[90vh] p-0 rounded-xl">
        <div className="relative">
          {/* Modern gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background/90 z-0"></div>
          
          {/* Header with enhanced brand identity */}
          <div className="relative z-10 px-6 pt-6">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-primary/10 p-3 mb-2 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mb-2">
                {activeTab === "login" ? "Welcome Back" : "Join KIZERE"}
              </DialogTitle>
              <DialogDescription className="text-center max-w-xs mx-auto">
                {activeTab === "login" 
                  ? "Secure access to your registered items and protection features" 
                  : "Create an account to start tracking and protecting your valuable possessions"}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Google Sign-In Button - PROMINENT (Above tabs) */}
          <div className="px-6 pt-3 pb-4">
            <div className="text-xs text-center mb-2 text-primary font-medium">
              Recommended
            </div>
            <Button 
              type="button" 
              className="w-full h-14 bg-[#00BFFF] hover:bg-[#00A0D6] text-white transition-all shadow-md hover:shadow-lg rounded-md border-0 flex items-center justify-center"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  <span className="text-base font-medium">Signing in with Google...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center bg-white p-1 rounded-full mr-3">
                    <SiGoogle className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-base font-medium">Continue with Google</span>
                </>
              )}
            </Button>
            <div className="flex items-center justify-center mt-2">
              <ShieldCheck className="h-4 w-4 text-primary mr-1" />
              <p className="text-xs text-muted-foreground">
                Fast, secure login with your Google account
              </p>
            </div>
          </div>

          <div className="relative mb-4 mx-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Or use email/password
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 mx-auto max-w-[90%]">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Username / Phone / Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input 
                              className="pl-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" 
                              placeholder="Enter your username, phone, or email" 
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input 
                              className="pl-10 pr-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-2.5 text-muted-foreground/80 hover:text-muted-foreground"
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

                  <div className="flex justify-between items-center text-sm mt-3">
                    <div className="flex items-center bg-muted/10 border border-muted/20 rounded-md px-2 py-1">
                      <input 
                        type="checkbox" 
                        id="remember" 
                        className="rounded border-input h-4 w-4 text-primary accent-primary"
                      />
                      <label htmlFor="remember" className="ml-2 text-muted-foreground">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="text-primary hover:underline font-medium">
                      Forgot password?
                    </a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-10 font-medium shadow-sm transition-all hover:shadow-md" 
                    disabled={loginMutation.isPending}
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


                </form>
              </Form>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register" className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input className="pl-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" placeholder="Enter your full name" {...field} />
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
                        <FormLabel className="text-sm font-medium">Phone Number or Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input 
                              className="pl-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" 
                              placeholder="e.g. +250 xxx xxx xxx or your@email.com" 
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input 
                              className="pl-10 pr-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" 
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
                              className="absolute right-3 top-2.5 text-muted-foreground/80 hover:text-muted-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        <PasswordStrengthIndicator passwordStrength={passwordStrength} />
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
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                            <Input 
                              className="pl-10 pr-10 h-10 border-muted/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm" 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-2.5 text-muted-foreground/80 hover:text-muted-foreground"
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

                  <div className="flex items-center space-x-2 mt-4 p-2 rounded-md bg-muted/10 border border-muted/20">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      className="rounded border-input h-4 w-4 text-primary accent-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-10 font-medium shadow-sm transition-all hover:shadow-md" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>


                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}