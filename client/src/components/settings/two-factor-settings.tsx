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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </div>
          {isEnabled && (
            <Badge variant="default" className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone verification status */}
        {hasPhone && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/40">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-xs text-muted-foreground">{user?.phoneNumber}</p>
              </div>
            </div>
            {phoneVerified ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendPhoneOTP}
                disabled={phoneSending}
              >
                {phoneSending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
              </Button>
            )}
          </div>
        )}

        {/* Phone OTP verification inline */}
        {showPhoneVerify && (
          <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your phone:</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={phoneOTP} onChange={setPhoneOTP}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowPhoneVerify(false); setPhoneOTP(''); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleVerifyPhone} disabled={phoneOTP.length !== 6 || phoneVerifying}>
                {phoneVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Verify
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
                className="w-full"
                variant="outline"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
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
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod === 'sms' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="sms"
                        checked={selectedMethod === 'sms'}
                        onChange={() => setSelectedMethod('sms')}
                        className="sr-only"
                      />
                      <Smartphone className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">SMS</p>
                        <p className="text-xs text-muted-foreground">Receive codes via text message</p>
                      </div>
                    </label>
                  )}
                  
                  {hasEmail && (
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod === 'email' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="email"
                        checked={selectedMethod === 'email'}
                        onChange={() => setSelectedMethod('email')}
                        className="sr-only"
                      />
                      <Mail className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-xs text-muted-foreground">Receive codes via email</p>
                      </div>
                    </label>
                  )}

                  {hasPhone && phoneVerified && hasEmail && (
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod === 'both' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="2fa-method"
                        value="both"
                        checked={selectedMethod === 'both'}
                        onChange={() => setSelectedMethod('both')}
                        className="sr-only"
                      />
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Both</p>
                        <p className="text-xs text-muted-foreground">Choose between SMS or Email at login</p>
                      </div>
                    </label>
                  )}
                </div>

                {!hasPhone && !hasEmail && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">You need a verified phone number or email to enable 2FA.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEnabling(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEnable2FA}
                    disabled={isLoading || (!hasPhone && !hasEmail)}
                    className="flex-1"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Enable
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 2FA is enabled — show disable option */
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm">
                2FA is active via <strong>{user?.twoFactorMethod === 'both' ? 'SMS & Email' : user?.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}</strong>.
                You'll be asked for a code when you log in.
              </p>
            </div>
            
            {!showDisableForm ? (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setShowDisableForm(true)}
              >
                Disable Two-Factor Authentication
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter your password to disable 2FA:</p>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={!disablePassword || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Disable 2FA
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
