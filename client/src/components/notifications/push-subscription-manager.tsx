import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushSubscriptionManager() {
    const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

    if (!isSupported) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle>Browser Notifications</CardTitle>
                </div>
                <CardDescription>
                    Get real-time alerts for matches and messages even when the app is closed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium leading-none">
                            {isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {isSubscribed
                                ? "You are receiving desktop and mobile alerts."
                                : "Enable to stay updated on your reports."}
                        </span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                        <Switch
                            checked={isSubscribed}
                            onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                            disabled={isLoading}
                        />
                    )}
                </div>
                {!isSubscribed && !isLoading && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={subscribe}
                    >
                        Enable Push Notifications
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
