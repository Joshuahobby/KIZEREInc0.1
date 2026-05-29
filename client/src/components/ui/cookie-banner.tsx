import { useState, useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("kizere_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("kizere_cookie_consent", "accepted");
    // Additionally, we would initialize analytics/tracking here
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("kizere_cookie_consent", "declined");
    // Ensure no non-essential cookies are set
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur-md shadow-lg px-4 py-3">
        <p className="flex-1 text-xs text-muted-foreground leading-snug">
          We use cookies for security and analytics as per Rwanda Law No. 058/2021.{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleDecline} className="text-xs h-7 px-3 whitespace-nowrap">
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept} className="text-xs h-7 px-3 whitespace-nowrap font-semibold">
            Accept
          </Button>
          <button type="button" onClick={handleDecline} className="text-muted-foreground hover:text-foreground ml-1" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
