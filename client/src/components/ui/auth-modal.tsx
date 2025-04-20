import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, KeyRound, User, Phone, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { AuthModel } from "@/models/auth.model";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth.service";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

// Use types from our authentication model
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
  
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

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

  function redirectToDashboardByRole(role: string): void {
    navigate(getDashboardPathByRole(role));
  }

  function getDashboardPathByRole(role: string): string {
    switch (role) {
      case "Admin":
        return "/admin"; // Updated to match App.tsx
      case "Agent":
        return "/lost-found"; // Updated to match App.tsx
      default:
        return "/dashboard";
    }
  }

  const onLoginSubmit = (data: LoginFormValues) => {
    const loginData = AuthModel.prepareLoginData(data);
    loginMutation.mutate(loginData, {
      onSuccess: (user) => {
        toast({
          title: "Welcome back!",
          description: `You have successfully signed in as ${user.fullName || user.username}`,
        });
        onClose();
        redirectToDashboardByRole(user.role);
      },
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const registerData = AuthModel.prepareRegisterData(data);
    registerMutation.mutate(registerData, {
      onSuccess: (user) => {
        toast({
          title: "Account created!",
          description: "You have successfully created an account",
        });
        onClose();
        redirectToDashboardByRole(user.role);
      },
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      // Simply trigger the Firebase sign-in process
      // The AuthProvider in use-auth.tsx will handle the backend integration
      // and redirection based on the user's role
      await signInWithGoogle();
      
      // Just close the modal - navigation will be handled by the AuthProvider
      onClose();
      
    } catch (error: any) {
      console.error("Google sign-in failed:", error);
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
      <DialogContent className="sm:max-w-[500px] md:max-w-[700px] p-0 rounded-xl overflow-hidden">
        <div className="p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-center">
              {activeTab === "login" ? "Welcome Back" : "Join KIZERE"}
            </DialogTitle>
            <DialogDescription className="text-center mx-auto max-w-xs">
              {activeTab === "login" 
                ? "Secure access to your registered items and protection features" 
                : "Create an account to start tracking and protecting your valuable possessions"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            {/* Left side - Google sign-in */}
            <div className="md:w-1/3 flex flex-col items-center justify-center border-r border-border pr-4">
              <h3 className="text-lg font-medium mb-4">Quick Access</h3>
              <button 
                type="button" 
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 h-12 px-4 rounded-md border border-gray-300 shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Signing in...</span>
                  </>
                ) : (
                  <>
                    <SiGoogle className="h-5 w-5 text-[#4285F4]" />
                    <span className="font-medium">Continue with Google</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Right side - Forms */}
            <div className="md:w-2/3">
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username / Phone / Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                                <Input 
                                  className="pl-10 h-10" 
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
                                  className="pl-10 h-10" 
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
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="remember" 
                            className="rounded border-input h-4 w-4 text-primary"
                          />
                          <label htmlFor="remember" className="text-muted-foreground">
                            Remember me
                          </label>
                        </div>
                        <a href="#" className="text-primary hover:underline font-medium">
                          Forgot password?
                        </a>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-10 mt-2" 
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
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                                <Input className="pl-10 h-10" placeholder="Enter your full name" {...field} />
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
                                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                                <Input 
                                  className="pl-10 h-10" 
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
                                  className="pl-10 h-10" 
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
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/70" />
                                <Input 
                                  className="pl-10 h-10" 
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
                        className="w-full h-10 mt-2" 
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}