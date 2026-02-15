import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSupport = () => {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);
            if (supported) {
                checkSubscription();
            } else {
                setIsLoading(false);
            }
        };

        checkSupport();
    }, [user]);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("Error checking push subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const subscribe = useCallback(async () => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const { publicKey } = await apiRequest<{ publicKey: string }>("/api/notifications/vapid-public-key");

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Save subscription to server
            await apiRequest("/api/notifications/subscribe", {
                method: "POST",
                data: {
                    subscription,
                    userAgent: navigator.userAgent
                }
            });

            setIsSubscribed(true);
            toast({
                title: "Subscribed!",
                description: "You will now receive push notifications."
            });
        } catch (error) {
            console.error("Error subscribing to push notifications:", error);
            toast({
                title: "Subscription failed",
                description: "Please check your browser permissions.",
                variant: "destructive"
            });
        }
    }, [isSupported, toast]);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await apiRequest("/api/notifications/unsubscribe", {
                    method: "POST",
                    data: { endpoint: subscription.endpoint }
                });
            }

            setIsSubscribed(false);
            toast({
                title: "Unsubscribed",
                description: "You will no longer receive push notifications."
            });
        } catch (error) {
            console.error("Error unsubscribing from push notifications:", error);
        }
    }, [toast]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe
    };
}

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
