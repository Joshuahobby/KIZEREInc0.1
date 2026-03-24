import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { UserPreferences } from "@shared/schema";
import { 
  ShieldCheck, 
  Smartphone, 
  Megaphone,
  Sparkles,
  Lock,
  ShieldAlert,
  Target,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from 'canvas-confetti';

interface Step {
  title: string;
  description: string;
  selector?: string;
  icon: React.ReactNode;
}

const getSubscriberSteps = (t: any): Step[] => [
  {
    title: t('walkthrough.sub.welcome.title'),
    description: t('walkthrough.sub.welcome.desc'),
    icon: <Sparkles />,
    selector: '[data-tour="welcome-section"]'
  },
  {
    title: t('walkthrough.sub.kyc.title'),
    description: t('walkthrough.sub.kyc.desc'),
    icon: <ShieldCheck />,
    selector: '[data-tour="kyc-alert"]'
  },
  {
    title: t('walkthrough.sub.vault.title'),
    description: t('walkthrough.sub.vault.desc'),
    icon: <Lock />,
    selector: '[data-tour="identity-protection"]'
  },
  {
    title: t('walkthrough.sub.assets.title'),
    description: t('walkthrough.sub.assets.desc'),
    icon: <Smartphone />,
    selector: '[data-tour="register-item"]'
  },
  {
    title: t('walkthrough.sub.recovery.title'),
    description: t('walkthrough.sub.recovery.desc'),
    icon: <Megaphone />,
    selector: '[data-tour="report-lost"]'
  }
];

const getAgentSteps = (t: any): Step[] => [
  {
    title: t('walkthrough.agent.mission.title'),
    description: t('walkthrough.agent.mission.desc'),
    icon: <ShieldAlert />,
    selector: '[data-tour="welcome-section"]'
  },
  {
    title: t('walkthrough.agent.ops.title'),
    description: t('walkthrough.agent.ops.desc'),
    icon: <Target />,
    selector: '[data-tour="agent-ops"]'
  },
  {
    title: t('walkthrough.agent.stats.title'),
    description: t('walkthrough.agent.stats.desc'),
    icon: <TrendingUp />,
    selector: '[data-tour="agent-stats"]'
  },
  {
    title: t('walkthrough.agent.queue.title'),
    description: t('walkthrough.agent.queue.desc'),
    icon: <LayoutDashboard />,
    selector: '[data-tour="agent-reports"]'
  }
];

export const OnboardingTour = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  
  const queryClient = useQueryClient();
  const updatePrefs = useMutation({
    mutationFn: async (prefs: Partial<UserPreferences>) => {
      // FIX: Use correctly as apiRequest(url, { method, data })
      return await apiRequest("/api/me/preferences", { 
        method: "PUT", 
        data: prefs 
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
    },
  });

  const steps = React.useMemo(() => {
    const isAgent = user?.role === 'Agent' || user?.role === 'Admin';
    return isAgent ? getAgentSteps(t) : getSubscriberSteps(t);
  }, [user?.role, t]);

  const onComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#047857', '#10b981', '#34d399', '#ffffff']
    });

    updatePrefs.mutate({ onboardingTourSeen: true });
    
    setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  };

  // Add support for manual replay via custom event
  React.useEffect(() => {
    const handleReplay = () => {
      setCurrentStep(0);
      setIsVisible(true);
    };

    window.addEventListener('replay-onboarding', handleReplay);
    return () => window.removeEventListener('replay-onboarding', handleReplay);
  }, []);

  React.useEffect(() => {
    // Show tour if not seen before, after a short delay
    if (user && !user.preferences?.onboardingTourSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleNext = React.useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    
    // Celebratory Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#2dd4bf', '#ffffff']
    });

    const currentPrefs = user?.preferences || {};
    const updatedPrefs = {
      ...currentPrefs,
      onboardingTourSeen: true
    };
    
    updatePrefs.mutate(updatedPrefs);
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <Highlight 
        selector={currentStepData.selector} 
        currentStep={currentStep}
        totalSteps={steps.length}
        description={currentStepData.description}
        icon={currentStepData.icon}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleComplete}
      />
    </div>
  );
};

interface HighlightProps {
  selector?: string;
  currentStep: number;
  totalSteps: number;
  description: string;
  icon: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const Highlight = ({ 
  selector, 
  currentStep, 
  totalSteps, 
  description, 
  icon, 
  onNext, 
  onBack, 
  onSkip 
}: HighlightProps) => {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setRect(null);
      }
    };

    update();
    const interval = setInterval(update, 500);

    // Interactive Trigger
    const el = document.querySelector(selector);
    const handleInteraction = () => {
      setTimeout(onNext, 300);
    };

    if (el) {
      el.addEventListener('click', handleInteraction);
    }

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    return () => {
      clearInterval(interval);
      if (el) el.removeEventListener('click', handleInteraction);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [selector, onNext]);

  const isCentered = !selector || !rect;

  return (
    <AnimatePresence>
      <div className="contents px-4">
        {rect && (
          <motion.div
            key="highlight"
            initial={false}
            animate={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              opacity: 1
            }}
            transition={{ type: "spring", stiffness: 150, damping: 25 }}
            className="fixed z-[105] rounded-xl border-2 border-primary/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)] pointer-events-none"
          >
            {/* Attention Pulse Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl border-4 border-primary/20 pointer-events-none"
            />
          </motion.div>
        )}

        <motion.div
          key={isCentered ? "centered" : selector}
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{
            opacity: 1,
            scale: 1,
            ...(isCentered 
              ? { top: "50%", left: "50%", x: "-50%", y: "-50%" } 
              : { 
                  top: rect.bottom + 15 > window.innerHeight - 150 ? rect.top - 15 : rect.bottom + 15,
                  left: rect.left + (rect.width / 2),
                  x: "-50%",
                  y: 0,
                  translateY: rect.bottom + 15 > window.innerHeight - 150 ? "-100%" : "0%"
                })
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "fixed z-[110] w-[280px] pointer-events-auto",
            isCentered ? "max-w-[85vw]" : ""
          )}
        >
          <div className="bg-background/95 backdrop-blur-md border border-primary/30 rounded-2xl shadow-xl p-4 relative overflow-hidden ring-1 ring-white/10">
            <div className="flex gap-3 items-start">
              <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 text-primary" })}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-primary/80 mb-0.5">
                  {t('walkthrough.stepOf', { current: (currentStep + 1).toString(), total: totalSteps.toString() })}
                </h4>
                <p className="text-[13px] font-bold text-foreground leading-tight tracking-tight">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-[10px] font-bold text-muted-foreground hover:text-foreground no-underline"
                onClick={onSkip}
              >
                {t('walkthrough.end')}
              </Button>

              <div className="flex gap-1.5">
                {currentStep > 0 && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-7 px-2.5 text-[10px] font-bold bg-secondary/50"
                    onClick={onBack}
                  >
                    {t('common.back') || "Back"}
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className="h-7 px-4 text-[10px] font-black shadow-lg shadow-primary/20"
                  onClick={onNext}
                >
                  {currentStep === totalSteps - 1 ? t('walkthrough.finish') : t('common.next') || "Next"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
