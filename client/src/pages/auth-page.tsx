import * as React from "react";
import { useLocation, Link } from "wouter";
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const returnUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("returnUrl") ?? undefined
    : undefined;

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    const loginData = AuthModel.prepareLoginData(data);
    loginMutation.mutate(loginData, {
      onSuccess: () => {
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const registerData = AuthModel.prepareRegisterData(data);
    console.log("[AuthPage] Submitting registration data:", { ...registerData, password: "[REDACTED]" });
    
    registerMutation.mutate(registerData, {
      onSuccess: (responseData: any) => {
        console.log("[AuthPage] Registration success response:", responseData);
        setIsSubmitting(false);
        ReactGA.event("sign_up", {
          method: "Email",
          role: data.role
        });
      },
      onError: (error: any) => {
        console.error("[AuthPage] Registration error:", error);
        setIsSubmitting(false);
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
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col selection:bg-primary/30">
      <div className="flex-grow flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.15),transparent_70%)] pointer-events-none" />

        <motion.div
          className="text-center mb-10 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
            KIZERE<span className="text-primary">.</span>
          </h1>
          <p className="text-white/40 mt-4 text-xs md:text-sm font-bold uppercase tracking-[0.3em]">{t('dashboard.smartItemManagement') || "Smart Item Management"}</p>
        </motion.div>

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-[#0B0F1A] border-white/10 shadow-premium rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-white/5 border border-white/5 p-1 rounded-2xl">
                  <TabsTrigger value="login" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px]">{t('auth.signIn')}</TabsTrigger>
                  <TabsTrigger value="register" className="h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px]">{t('auth.createAccount')}</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <div className="space-y-4 mb-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-14 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 font-bold"
                      onClick={() => loginWithGoogle(returnUrl)}
                      disabled={authLoading || loginMutation.isPending}
                    >
                      <SiGoogle className="mr-3 h-5 w-5 text-[#4285F4]" />
                      <span className="tracking-wide">{t('auth.signInWithGoogle')}</span>
                    </Button>


                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/5"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0B0F1A] px-4 text-white/20 font-black tracking-[0.2em] text-[9px]">{t('auth.continueWithUsername')}</span>
                      </div>
                    </div>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.username')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all" placeholder={t('auth.username')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.password')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                  className="pl-12 pr-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all"
                                  type={showPassword ? "text" : "password"}
                                  placeholder={t('auth.password')}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                          const checkbox = document.getElementById('remember') as HTMLInputElement;
                          if (checkbox) checkbox.checked = !checkbox.checked;
                        }}>
                          <input
                            type="checkbox"
                            id="remember"
                            className="rounded-lg border-white/10 bg-white/5 h-6 w-6 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                          />
                          <label htmlFor="remember" className="text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors cursor-pointer">
                            {t('auth.rememberMe')}
                          </label>
                        </div>
                        <Link href="/forgot-password" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors py-2 px-1">
                          {t('auth.forgotPassword')}
                        </Link>
                      </div>

                      <Button
                        type="submit"
                        className="w-full mt-4 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-sm bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
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
                  <div className="space-y-4 mb-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-14 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 font-bold"
                      onClick={() => loginWithGoogle(returnUrl)}
                      disabled={authLoading || registerMutation.isPending}
                    >
                      <SiGoogle className="mr-3 h-5 w-5 text-[#4285F4]" />
                      <span className="tracking-wide">{t('auth.signUpWithGoogle')}</span>
                    </Button>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/5"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0B0F1A] px-4 text-white/20 font-black tracking-[0.2em] text-[9px]">{t('auth.continueWithAccount')}</span>
                      </div>
                    </div>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.fullName')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all" placeholder={t('auth.fullNamePlaceholder')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.emailPhone')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all" placeholder={t('auth.emailPhonePlaceholder')} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.password')}</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                  <Input
                                    className="pl-12 pr-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all"
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                              <PasswordStrengthIndicator score={passwordStrength?.score || 0} maxScore={5} />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('auth.confirmPassword')}</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                  <Input
                                    className="pl-12 pr-12 h-14 bg-white/5 border-white/5 rounded-2xl font-bold text-white focus:ring-primary/20 transition-all"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder={t('auth.confirmPasswordPlaceholder')}
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="isOver16"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-4 space-y-0 mt-6 group cursor-pointer" onClick={() => field.onChange(!field.value)}>
                            <FormControl>
                              <input
                                type="checkbox"
                                id="age-verify"
                                aria-label="Confirm age over 16"
                                title="Age Verification"
                                className="rounded-lg border-white/10 bg-white/5 h-6 w-6 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                checked={field.value || false}
                                readOnly
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors cursor-pointer leading-relaxed">
                                I confirm that I am at least 16 years of age.
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="consentGiven"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-4 space-y-0 mt-6 group cursor-pointer" onClick={(e) => {
                            // Prevent toggle if clicking the link
                            if ((e.target as HTMLElement).tagName === 'A') return;
                            field.onChange(!field.value);
                          }}>
                            <FormControl>
                              <input
                                type="checkbox"
                                id="terms"
                                aria-label="Privacy Policy Consent"
                                title="Privacy Policy Consent"
                                className="rounded-lg border-white/10 bg-white/5 h-6 w-6 text-primary focus:ring-primary/20 transition-all cursor-pointer mt-0.5"
                                checked={field.value || false}
                                readOnly
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors cursor-pointer leading-relaxed">
                                I explicitly consent to the processing of my personal data for item registration, lost & found reporting, and identity verification purposes, as detailed in the <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4">Privacy Policy</Link> (Rwanda Law No. 058/2021).
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full mt-8 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-sm bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
                        disabled={registerMutation.isPending || isSubmitting}
                      >
                        {registerMutation.isPending || isSubmitting ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
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