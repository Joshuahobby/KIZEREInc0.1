import * as React from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { AuthService } from "@/services/auth.service";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ReactGA from "react-ga4";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userRoles, UserPreferences } from "@shared/schema";
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
  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "login";
    }
    return "login";
  });
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = React.useState<{ isStrong: boolean; message: string; score: number } | null>(null);
  const { user, loginMutation, registerMutation, loginWithGoogle, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [location, navigate] = useLocation();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");

      if (returnUrl) {
        navigate(returnUrl);
      } else {
        // Use role-specific dashboard instead of landing page
        const dashboardPath = AuthService.getDashboardPathByRole(
          user.role,
          (user.preferences as UserPreferences)?.dashboardStyle
        );
        navigate(dashboardPath);
      }
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
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        ReactGA.event("sign_up", {
          method: "Email",
          role: data.role
        });
      }
    });
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
      <div className="flex-grow flex flex-col items-center justify-center py-4 px-4 sm:py-8 sm:px-6 lg:px-8">

        {/* Simple Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">KIZERE</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('dashboard.smartItemManagement') || "Smart Item Management"}</p>
        </motion.div>

        {/* Auth Forms with Glass Morphism */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="backdrop-blur-sm bg-card/80 border border-border/40 shadow-xl">
            <CardContent className="p-3 sm:p-6 pb-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3 h-9">
                  <TabsTrigger value="login" className="text-xs sm:text-sm">{t('auth.signIn')}</TabsTrigger>
                  <TabsTrigger value="register" className="text-xs sm:text-sm">{t('auth.createAccount')}</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <div className="space-y-3 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 border-border/60 hover:bg-muted/50 transition-all duration-300"
                      onClick={() => loginWithGoogle()}
                      disabled={authLoading || loginMutation.isPending}
                    >
                      <SiGoogle className="mr-3 h-4 w-4 text-[#4285F4]" />
                      {t('auth.signInWithGoogle')}
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('auth.continueWithUsername')}</span>
                      </div>
                    </div>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.username')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9 h-9 text-sm" placeholder={t('auth.username')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-9 pr-9 h-9 text-sm"
                                  type={showPassword ? "text" : "password"}
                                  placeholder={t('auth.password')}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-2.5 text-muted-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0" />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between items-center mt-1 mb-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember"
                            className="rounded border-input h-3.5 w-3.5 text-primary focus:ring-primary"
                          />
                          <label htmlFor="remember" className="text-xs text-muted-foreground">
                            {t('auth.rememberMe')}
                          </label>
                        </div>
                        <a href="#" className="text-xs text-primary hover:underline">
                          {t('auth.forgotPassword')}
                        </a>
                      </div>

                      <Button
                        type="submit"
                        className="w-full mt-2 h-9 text-sm"
                        disabled={loginMutation.isPending}
                        size="sm"
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            {t('auth.signingIn')}
                          </>
                        ) : (
                          t('auth.signIn')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Registration Form */}
                <TabsContent value="register">
                  <div className="space-y-3 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-border/60 hover:bg-muted/50 transition-all duration-300"
                      onClick={() => loginWithGoogle()}
                      disabled={authLoading || registerMutation.isPending}
                    >
                      <SiGoogle className="mr-3 h-4 w-4 text-[#4285F4]" />
                      {t('auth.signUpWithGoogle')}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('auth.continueWithAccount')}</span>
                      </div>
                    </div>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.fullName')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9 h-9 text-sm" placeholder={t('auth.fullNamePlaceholder')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.emailPhone')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9 h-9 text-sm" placeholder={t('auth.emailPhonePlaceholder')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.password')}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    className="pl-9 pr-9 h-9 text-sm"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t('auth.password')}
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
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] mt-0" />
                              <PasswordStrengthIndicator score={passwordStrength?.score || 0} maxScore={5} />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-foreground/80 text-xs sm:text-sm">{t('auth.confirmPassword')}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    className="pl-9 pr-9 h-9 text-sm"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder={t('auth.confirmPasswordPlaceholder')}
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-2.5 text-muted-foreground"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] mt-0" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-2 mt-1 mb-1">
                        <input
                          type="checkbox"
                          id="terms"
                          className="rounded border-input h-3.5 w-3.5 text-primary focus:ring-primary"
                        />
                        <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                          {t('auth.termsAndPrivacy').split('&')[0]} <a href="#" className="text-primary hover:underline">{t('auth.terms')}</a> & <a href="#" className="text-primary hover:underline">{t('auth.privacy')}</a>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full mt-2 h-9 text-sm"
                        disabled={registerMutation.isPending}
                        size="sm"
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            {t('auth.creatingAccount')}
                          </>
                        ) : (
                          t('auth.createAccount')
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
  );
}