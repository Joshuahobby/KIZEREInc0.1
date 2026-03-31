import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { ShieldCheck, Smartphone, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TwoFactorMethod = 'sms' | 'email' | 'both';

interface TwoFactorSettingsProps {
  className?: string;
}

export default function TwoFactorSettings({ className }: TwoFactorSettingsProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('sms');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone verification
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const isEnabled = user?.twoFactorEnabled ?? false;
  const phoneVerified = user?.phoneVerified ?? false;
  const hasPhone = !!user?.phoneNumber;
  const hasEmail = !!user?.email && !user.email.includes('@placeholder.kizere.rw');

  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      await apiRequest('/api/auth/2fa/enable', {
        method: 'POST',
        data: { method: selectedMethod },
      });
      await refreshUser();
      setIsEnabling(false);
      toast({
        title: '2FA Enabled',
        description: `Two-factor authentication has been enabled via ${selectedMethod === 'both' ? 'SMS & Email' : selectedMethod === 'sms' ? 'SMS' : 'Email'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to enable 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      await apiRequest('/api/auth/2fa/disable', {
        method: 'POST',
        data: { password: disablePassword },
      });
      await refreshUser();
      setShowDisableForm(false);
      setDisablePassword('');
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    try {
      setPhoneSending(true);
      await apiRequest('/api/auth/send-phone-otp', { method: 'POST' });
      setShowPhoneVerify(true);
      toast({
        title: 'Code Sent',
        description: 'Verification code sent to your phone number.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (phoneOTP.length !== 6) return;
    try {
      setPhoneVerifying(true);
      await apiRequest('/api/auth/verify-phone', {
        method: 'POST',
        data: { code: phoneOTP },
      });
      await refreshUser();
      setShowPhoneVerify(false);
      setPhoneOTP('');
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Verification Failed',
        description: err.message || 'Invalid code',
        variant: 'destructive',
      });
    } finally {
      setPhoneVerifying(false);
    }
  };

  return (
    <Card className={cn("border-white/10 shadow-premium bg-[#0B0F1A]", className)}>
      <CardHeader className="border-b border-white/5 pb-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight">Two-Factor Authentication</CardTitle>
            <CardDescription className="font-bold text-white/40 text-xs">
              Add an extra layer of security to your account
            </CardDescription>
          </div>
          {isEnabled && (
            <Badge variant="default" className="ml-auto bg-emerald-500 text-black border-none font-black h-8 px-3 rounded-full">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              ENABLED
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {/* Phone verification status */}
        {hasPhone && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <Smartphone className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Phone Number</p>
                <p className="text-base font-black text-white">{user?.phoneNumber}</p>
              </div>
            </div>
            {phoneVerified ? (
              <Badge variant="outline" className="h-10 px-4 rounded-xl border-emerald-500/50 text-emerald-500 font-black bg-emerald-500/5 transition-all">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                VERIFIED
              </Badge>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={handleSendPhoneOTP}
                disabled={phoneSending}
                className="h-14 w-full sm:w-auto rounded-2xl font-black bg-primary text-black hover:bg-primary/90 border-none shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              >
                {phoneSending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFY NOW'}
              </Button>
            )}
          </div>
        )}

        {/* Phone OTP verification inline */}
        {showPhoneVerify && (
          <div className="space-y-6 p-6 rounded-2xl border border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="space-y-2 text-center">
               <p className="text-sm font-black text-white tracking-tight">VERIFICATION REQUIRED</p>
               <p className="text-xs font-bold text-white/40 italic">Enter the 6-digit code sent to your phone</p>
            </div>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={phoneOTP} onChange={setPhoneOTP} className="gap-3">
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                  <InputOTPSlot index={1} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                  <InputOTPSlot index={2} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                </InputOTPGroup>
                <InputOTPSeparator className="text-primary/30" />
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={3} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                  <InputOTPSlot index={4} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                  <InputOTPSlot index={5} className="h-14 w-12 rounded-xl bg-slate-900 border-white/20 text-xl font-black text-primary data-[active=true]:border-primary" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
              <Button variant="ghost" className="h-14 font-black text-white/40 hover:text-white" onClick={() => { setShowPhoneVerify(false); setPhoneOTP(''); }}>
                CANCEL
              </Button>
              <Button className="h-14 px-8 rounded-2xl font-black bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all" onClick={handleVerifyPhone} disabled={phoneOTP.length !== 6 || phoneVerifying}>
                {phoneVerifying ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                CONFIRM CODE
              </Button>
            </div>
          </div>
        )}

        {/* 2FA Toggle */}
        {!isEnabled ? (
          <>
            {!isEnabling ? (
              <Button
                onClick={() => setIsEnabling(true)}
                className="h-14 w-full rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-premium group transition-all"
                variant="outline"
              >
                <ShieldCheck className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                ENABLE TWO-FACTOR SECURITY
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose how you want to receive verification codes:
                </p>

                {/* Method selection */}
                <div className="space-y-2">
                  {hasPhone && phoneVerified && (
                    <label
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group h-20",
                        selectedMethod === 'sms' 
                          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      )}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="sms"
                        checked={selectedMethod === 'sms'}
                        onChange={() => setSelectedMethod('sms')}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        selectedMethod === 'sms' ? 'bg-primary text-black' : 'bg-white/5 text-white/40'
                      )}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-black uppercase tracking-wider", selectedMethod === 'sms' ? 'text-white' : 'text-white/40')}>SMS Protection</p>
                        <p className="text-xs font-bold text-white/30 italic">Secure codes via text message</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedMethod === 'sms' ? 'border-primary' : 'border-white/20'
                      )}>
                        {selectedMethod === 'sms' && <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
                      </div>
                    </label>
                  )}
                  
                  {hasEmail && (
                    <label
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group h-20",
                        selectedMethod === 'email' 
                          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      )}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="email"
                        checked={selectedMethod === 'email'}
                        onChange={() => setSelectedMethod('email')}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        selectedMethod === 'email' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'
                      )}>
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-black uppercase tracking-wider", selectedMethod === 'email' ? 'text-white' : 'text-white/40')}>Email Link</p>
                        <p className="text-xs font-bold text-white/30 italic">Secure codes via email</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedMethod === 'email' ? 'border-blue-500' : 'border-white/20'
                      )}>
                        {selectedMethod === 'email' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                      </div>
                    </label>
                  )}

                  {hasPhone && phoneVerified && hasEmail && (
                    <label
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group h-20",
                        selectedMethod === 'both' 
                          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]' 
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      )}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="both"
                        checked={selectedMethod === 'both'}
                        onChange={() => setSelectedMethod('both')}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        selectedMethod === 'both' ? 'bg-primary text-black' : 'bg-white/5 text-white/40'
                      )}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-black uppercase tracking-wider", selectedMethod === 'both' ? 'text-white' : 'text-white/40')}>Dual Channel</p>
                        <p className="text-xs font-bold text-white/30 italic">SMS & Email redundancy</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedMethod === 'both' ? 'border-primary' : 'border-white/20'
                      )}>
                        {selectedMethod === 'both' && <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />}
                      </div>
                    </label>
                  )}
                </div>

                {!hasPhone && !hasEmail && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <AlertCircle className="h-6 w-6 flex-shrink-0" />
                    <p className="text-sm font-bold leading-relaxed lowercase tracking-tight">You need a verified phone number or email to enable 2fa protection.</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsEnabling(false)} className="h-14 flex-1 rounded-2xl font-black text-white/40 hover:text-white">
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleEnable2FA}
                    disabled={isLoading || (!hasPhone && !hasEmail)}
                    className="h-14 flex-1 rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-premium"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                    FINALIZE SETUP
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 2FA is enabled — show disable option */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 shadow-inner">
              <p className="text-sm font-bold text-white/80 leading-relaxed italic">
                2FA Security is active via <span className="text-emerald-500 font-black uppercase text-xs mx-1 tracking-widest">{user?.twoFactorMethod === 'both' ? 'SMS & Email' : user?.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}</span>.
                KIZERE will request a verification code on every new login attempt.
              </p>
            </div>
            
            {!showDisableForm ? (
              <Button
                variant="outline"
                className="h-14 w-full rounded-2xl font-black text-red-500 bg-red-500/5 border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-premium"
                onClick={() => setShowDisableForm(true)}
              >
                TERMINATE TWO-FACTOR PROTECTION
              </Button>
            ) : (
              <div className="space-y-4 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <p className="text-xs font-black text-red-500 uppercase tracking-widest text-center">Security Check Required</p>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">CONFIRM CURRENT PASSWORD</Label>
                  <Input
                    type="password"
                    placeholder="Enter password..."
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-14 bg-slate-900 border-white/5 rounded-2xl font-black text-primary placeholder:text-white/10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}
                    className="h-14 flex-1 rounded-2xl font-black text-white/40"
                  >
                    CANCEL
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={!disablePassword || isLoading}
                    className="h-14 flex-1 rounded-2xl font-black bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                    DISABLE 2FA
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
