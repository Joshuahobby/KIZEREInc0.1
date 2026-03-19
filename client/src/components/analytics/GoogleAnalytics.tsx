import { useEffect } from "react";
import { useLocation } from "wouter";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      console.log("[Analytics] GA4 Initialized with ID:", GA_MEASUREMENT_ID);
    } else {
      console.warn("[Analytics] GA4 Measurement ID not found. Tracking disabled.");
    }
  }, []);

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location });
      console.log("[Analytics] Pageview sent:", location);
    }
  }, [location]);

  return null;
}
