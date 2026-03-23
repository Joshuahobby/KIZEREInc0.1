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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-background/95 backdrop-blur-md border-t shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="flex-1 max-w-4xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold mb-1">Cookie & Privacy Consent</h3>
          <button onClick={handleDecline} className="sm:hidden text-muted-foreground hover:text-foreground" aria-label="Close cookie banner" title="Close cookie banner">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground w-full sm:w-[85%]">
          We use essential cookies to make KIZERE work securely. With your consent, we may also use non-essential cookies to improve user experience, analyze website traffic, and understand our audience as per Rwanda Law No. 058/2021. 
          Read our <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a> to learn more about how we process your personal data.
        </p>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
        <Button variant="outline" onClick={handleDecline} className="flex-1 sm:flex-none whitespace-nowrap">
          Decline Non-Essential
        </Button>
        <Button onClick={handleAccept} className="flex-1 sm:flex-none whitespace-nowrap font-bold">
          Accept All Cookies
        </Button>
      </div>
    </div>
  );
}
