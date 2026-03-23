import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { ArrowLeft, Smartphone, Mail, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyOTPPage() {
  const { pending2FA, send2FACode, verify2FAMutation, clear2FA } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email' | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // Redirect if no pending 2FA
  useEffect(() => {
    if (!pending2FA) {
      console.log("[VerifyOTPPage] No pending2FA, redirecting to /auth");
      setLocation("/auth");
    }
  }, [pending2FA, setLocation]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async (channel: 'sms' | 'email') => {
    setSelectedChannel(channel);
    setOtpValue("");
    await send2FACode(channel);
    setCodeSent(true);
    setCountdown(60); // 60 second cooldown
  }, [send2FACode]);

  // Auto-select and auto-send if a preferred method is set or only one method available
  useEffect(() => {
    if (selectedChannel || codeSent || !pending2FA) return;

    let channelToAutoSend: 'sms' | 'email' | null = null;

    if (pending2FA.preferredMethod && ['sms', 'email'].includes(pending2FA.preferredMethod)) {
      channelToAutoSend = pending2FA.preferredMethod as 'sms' | 'email';
    } else if (pending2FA.methods.length === 1) {
      channelToAutoSend = pending2FA.methods[0] as 'sms' | 'email';
    }

    if (channelToAutoSend) {
      console.log(`[VerifyOTPPage] Auto-selecting and sending to ${channelToAutoSend}`);
      handleSendCode(channelToAutoSend);
    }
  }, [pending2FA, selectedChannel, codeSent, handleSendCode]);

  const handleVerify = useCallback(() => {
    if (otpValue.length === 6 && !verify2FAMutation.isPending) {
      verify2FAMutation.mutate(otpValue);
    }
  }, [otpValue, verify2FAMutation]);

  const handleBack = () => {
    console.log("[VerifyOTPPage] User requested to go back, clearing 2FA and going to /auth");
    clear2FA();
    setLocation("/auth");
  };

  if (!pending2FA) return null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </button>
        </div>

        <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
            >
              <ShieldCheck className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Two-Factor Verification
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {!codeSent
                ? "Choose how you'd like to receive your verification code"
                : `Enter the 6-digit code sent to ${selectedChannel === 'sms' ? 'your phone' : 'your email'}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {!codeSent ? (
                /* Step 1: Choose channel */
                <motion.div
                  key="channel-select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {pending2FA.methods.includes('sms') && (
                    <button
                      onClick={() => handleSendCode('sms')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Smartphone className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-foreground">SMS Message</p>
                        <p className="text-sm text-muted-foreground">
                          Send to {pending2FA.maskedPhone || 'your phone'}
                        </p>
                      </div>
                    </button>
                  )}

                  {pending2FA.methods.includes('email') && (
                    <button
                      onClick={() => handleSendCode('email')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Mail className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-sm text-muted-foreground">
                          Send to {pending2FA.maskedEmail || 'your email'}
                        </p>
                      </div>
                    </button>
                  )}
                </motion.div>
              ) : (
                /* Step 2: Enter OTP code */
                <motion.div
                  key="otp-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* OTP Input */}
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={(value) => setOtpValue(value)}
                      onComplete={handleVerify}
                      disabled={verify2FAMutation.isPending}
                    >
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

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerify}
                    disabled={otpValue.length !== 6 || verify2FAMutation.isPending}
                    className="w-full premium-button text-white font-semibold py-6 shadow-lg shadow-primary/20 border-none transition-all"
                  >
                    {verify2FAMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Verify & Sign In
                      </>
                    )}
                  </Button>

                  {/* Resend / Change method */}
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => {
                        setCodeSent(false);
                        setOtpValue("");
                        setSelectedChannel(null);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Change method
                    </button>

                    <button
                      onClick={() => selectedChannel && handleSendCode(selectedChannel)}
                      disabled={countdown > 0}
                      className={`flex items-center gap-1 transition-colors ${
                        countdown > 0
                          ? 'text-muted-foreground/50 cursor-not-allowed'
                          : 'text-primary hover:text-primary/80'
                      }`}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend code'}
                    </button>
                  </div>

                  {/* Expiry notice */}
                  <p className="text-center text-xs text-muted-foreground">
                    Code expires in 10 minutes. Don't share it with anyone.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
