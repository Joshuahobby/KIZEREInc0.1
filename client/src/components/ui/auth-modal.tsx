import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiGoogle } from "react-icons/si";
import { 
  Eye, 
  EyeOff, 
  KeyRound, 
  Loader2, 
  Phone, 
  Shield, 
  ShieldCheck, 
  User,
  ArrowDownRight
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
import { useAuth } from "@/hooks/use-auth";
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
  const [passwordStrength, setPasswordStrength] = useState<{ isStrong: boolean; message: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Use the auth context
  const auth = useAuth();
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

  // No need for custom redirection - auth hook will handle it

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const loginData = AuthModel.prepareLoginData(data);
      
      // Use the login method from useAuth hook
      await auth.login(loginData.username, loginData.password);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
      
      onClose();
      
      // Let the auth hook handle redirection
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
      
      // Use the signup method from useAuth hook
      await auth.signup(registerData.username, registerData.password, registerData.fullName);
      
      toast({
        title: "Account created!",
        description: "You have successfully created an account",
      });
      
      onClose();
      
      // Let the auth hook handle redirection
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
      
      // Use the auth hook's loginWithGoogle method
      // This will redirect to Google login page
      await auth.loginWithGoogle();
      
      // The code below won't execute because the page will redirect
      // The toast should be shown after redirect back and successful authentication
      // which is handled in the useAuth hook
      
      // onClose will be called automatically when the page redirects
    } catch (error: any) {
      // This will only run if there's an error initiating the redirect
      console.error("Google sign-in redirect failed:", error);
      toast({
        title: "Sign in failed",
        description: error?.message || "Failed to start Google authentication",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-0 rounded-xl overflow-hidden">
        <div className="px-6 pt-6">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              {activeTab === "login" ? "Welcome Back" : "Join KIZERE"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              {activeTab === "login" 
                ? "Secure access to your registered items and protection features" 
                : "Create an account to start tracking and protecting your valuable possessions"}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex flex-col md:flex-row p-6 pt-4 gap-6">
          {/* LEFT SIDE - Google sign-in */}
          <div className="md:w-2/5 flex flex-col">
            <div className="mb-1">
              <div className="flex items-center">
                <span className="text-sm font-medium text-primary">Recommended</span>
                <ArrowDownRight className="h-4 w-4 text-primary ml-1" />
              </div>
            </div>
            
            {/* Google button - big and prominent */}
            <Button 
              type="button" 
              className="w-full h-full min-h-[240px] bg-[#00BFFF] hover:bg-[#00A0D6] text-white shadow-md hover:shadow-lg rounded-md border-0 flex flex-col items-center justify-center"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin mb-4" />
                  <span className="text-xl font-medium">Signing in with Google...</span>
                </>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-full mb-4">
                    <SiGoogle className="h-10 w-10 text-gray-700" />
                  </div>
                  <span className="text-xl font-medium">Continue with Google</span>
                  <p className="text-sm mt-2 max-w-[200px] text-center opacity-90">
                    Fast, secure login with your Google account
                  </p>
                </>
              )}
            </Button>
          </div>
          
          {/* RIGHT SIDE - Traditional auth methods */}
          <div className="md:w-3/5">
            <div className="md:hidden relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  Or use email/password
                </span>
              </div>
            </div>

            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
                <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Register
                </TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login" className="pb-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username / Phone / Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                              <Input 
                                className="pl-10" 
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

                    <div className="flex justify-between items-center text-sm mt-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="remember" 
                          className="rounded border-input h-4 w-4 text-primary"
                        />
                        <label htmlFor="remember" className="ml-2 text-muted-foreground">
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full mt-2" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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
              <TabsContent value="register" className="pb-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
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
                          <FormLabel>Phone Number or Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                              <Input 
                                className="pl-10" 
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
                              <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                          <PasswordStrengthIndicator passwordStrength={passwordStrength} />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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

                    <div className="flex items-center space-x-2 mt-2">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        className="rounded border-input h-4 w-4 text-primary"
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
                      </label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full mt-2" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}