import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Save, Undo2, Layout, Palette, Bell } from "lucide-react";

interface UserPreferences {
  layout: string;
  theme: string;
  showStats: boolean;
  showActivity: boolean;
  showNotifications: boolean;
  showItems: boolean;
  notificationAlerts: boolean;
  emailNotifications: boolean;
}

interface PersonalizationSettingsProps {
  preferences: UserPreferences;
  isLoading: boolean;
  onClose?: () => void;
}

/**
 * Dashboard Personalization Settings Component
 * 
 * Allows users to customize their dashboard experience with layout options,
 * widget visibility settings, and notification preferences
 */
export const PersonalizationSettings = ({
  preferences: initialPreferences = {
    layout: "default",
    theme: "system",
    showStats: true,
    showActivity: true,
    showNotifications: true,
    showItems: true,
    notificationAlerts: true,
    emailNotifications: false
  },
  isLoading = false,
  onClose
}: PersonalizationSettingsProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("layout");
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  
  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      const res = await apiRequest("POST", "/api/user/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Preferences saved",
        description: "Your dashboard preferences have been updated.",
      });
      
      if (onClose) {
        onClose();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save preferences",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle preference change
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Reset preferences to defaults
  const handleReset = () => {
    setPreferences(initialPreferences);
  };
  
  // Save preferences
  const handleSave = () => {
    savePreferencesMutation.mutate(preferences);
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center">
          <Settings className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Dashboard Personalization
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="layout" className="flex items-center gap-1">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="layout" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Layout Style</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-md p-3 cursor-pointer relative ${
                      preferences.layout === "default" ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => handlePreferenceChange("layout", "default")}
                  >
                    <div className="h-20 w-full bg-muted/40 mb-2 flex items-center justify-center text-muted-foreground text-xs">
                      Default
                    </div>
                    <p className="text-xs text-muted-foreground">Standard dashboard layout</p>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-3 cursor-pointer relative ${
                      preferences.layout === "compact" ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => handlePreferenceChange("layout", "compact")}
                  >
                    <div className="h-20 w-full bg-muted/40 mb-2 flex items-center justify-center text-muted-foreground text-xs">
                      Compact
                    </div>
                    <p className="text-xs text-muted-foreground">Condensed information view</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-2">Widgets Visibility</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-stats" className="cursor-pointer">Show Statistics</Label>
                    <Switch
                      id="show-stats"
                      checked={preferences.showStats}
                      onCheckedChange={(checked) => handlePreferenceChange("showStats", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-activity" className="cursor-pointer">Show Activity Timeline</Label>
                    <Switch
                      id="show-activity"
                      checked={preferences.showActivity}
                      onCheckedChange={(checked) => handlePreferenceChange("showActivity", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-notifications" className="cursor-pointer">Show Notifications</Label>
                    <Switch
                      id="show-notifications"
                      checked={preferences.showNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange("showNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-items" className="cursor-pointer">Show Item Table</Label>
                    <Switch
                      id="show-items"
                      checked={preferences.showItems}
                      onCheckedChange={(checked) => handlePreferenceChange("showItems", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">Color Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                <div 
                  className={`border rounded-md p-3 cursor-pointer relative ${
                    preferences.theme === "light" ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handlePreferenceChange("theme", "light")}
                >
                  <div className="h-20 w-full bg-white border mb-2 flex items-center justify-center text-black text-xs">
                    Light
                  </div>
                  <p className="text-xs text-muted-foreground">Light mode</p>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer relative ${
                    preferences.theme === "dark" ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handlePreferenceChange("theme", "dark")}
                >
                  <div className="h-20 w-full bg-zinc-900 border border-zinc-800 mb-2 flex items-center justify-center text-white text-xs">
                    Dark
                  </div>
                  <p className="text-xs text-muted-foreground">Dark mode</p>
                </div>
                
                <div 
                  className={`border rounded-md p-3 cursor-pointer relative ${
                    preferences.theme === "system" ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handlePreferenceChange("theme", "system")}
                >
                  <div className="h-20 w-full bg-gradient-to-r from-white to-zinc-900 mb-2 flex items-center justify-center text-xs">
                    <span className="bg-white px-1 text-black">Sys</span>
                    <span className="bg-zinc-900 px-1 text-white">tem</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Follow system theme</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notification-alerts" className="block cursor-pointer">Browser Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show browser alerts for important events</p>
                </div>
                <Switch
                  id="notification-alerts"
                  checked={preferences.notificationAlerts}
                  onCheckedChange={(checked) => handlePreferenceChange("notificationAlerts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="block cursor-pointer">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive emails for critical updates</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={savePreferencesMutation.isPending}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Reset
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={savePreferencesMutation.isPending}
        >
          {savePreferencesMutation.isPending ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};