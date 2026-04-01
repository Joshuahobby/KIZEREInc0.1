import * as React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ShieldCheck,
  Loader2,
  KeyRound,
  User,
  Phone,
  Lock,
  Mail,
} from "lucide-react";

export default function ClaimAccountPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [step, setStep] = React.useState<"request" | "verify">("request");
  const [loading, setLoading] = React.useState(false);

  // Request form
  const [nationalId, setNationalId] = React.useState("");
  const [phone, setPhone] = React.useState("");

  // Verify form
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalId.length < 6 || phone.length < 8) {
      toast({ title: t("common.error", "Error"), description: t("pos.claim.invalidInput", "Please enter valid National ID and Phone number"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/claim/request-otp", {
        method: "POST",
        data: { nationalId, phone },
      });

      if (res.success) {
        setStep("verify");
        toast({ title: t("pos.claim.otpSent", "OTP Sent"), description: t("pos.claim.otpSentDesc", "Please check your phone for the verification code") });
      }
    } catch (err: any) {
      toast({ title: t("common.error", "Error"), description: err.message || "Failed to request OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({ title: t("common.error", "Error"), description: t("pos.claim.invalidOtp", "OTP must be 6 digits"), variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: t("common.error", "Error"), description: t("pos.claim.passwordLength", "Password must be at least 8 characters"), variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: t("common.error", "Error"), description: t("pos.claim.passwordMismatch", "Passwords do not match"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<any>("/api/pos/claim/verify", {
        method: "POST",
        data: { nationalId, phone, otp, newPassword, email: email || undefined },
      });

      if (res.success) {
        toast({ title: t("pos.claim.success", "Account Claimed!"), description: t("pos.claim.successDesc", "You can now log in with your new password") });
        setLocation("/auth");
      }
    } catch (err: any) {
      toast({ title: t("common.error", "Error"), description: err.message || "Failed to verify OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            {t("pos.claim.title", "Claim Your Account")}
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
            {step === "request" 
              ? t("pos.claim.requestDesc", "Activate the account created for you during your POS purchase.") 
              : t("pos.claim.verifyDesc", "Enter the OTP sent to your phone to set your new password.")}
          </p>

          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.nationalId", "National ID")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g. 1199880012345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.phone", "Phone Number")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {t("pos.claim.requestBtn", "Send Verification Code")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.claim.otp", "Verification Code")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono tracking-widest text-center text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.claim.newPassword", "New Password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.claim.confirmPassword", "Confirm Password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("pos.claim.email", "Email Address (Optional)")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t("pos.claim.emailHint", "Add an email to receive notifications about your products.")}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {t("pos.claim.verifyBtn", "Claim Account")}
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-sm">
            <Link href="/auth">
              <span className="text-primary hover:underline cursor-pointer font-medium">
                {t("pos.claim.backToLogin", "Back to Login")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}