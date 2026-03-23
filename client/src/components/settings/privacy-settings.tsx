import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Trash2, Mail, ShieldAlert, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestricting, setIsRestricting] = useState(user?.processingRestricted || false);

  const handleDataExport = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/me/data-export');
      if (!res.ok) throw new Error("Failed to export data");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kizere-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your data has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export your data at this time.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!window.confirm("Are you absolutely sure? This will initiate a 7-day grace period before your account and personal data are permanently deleted. This action cannot be undone after the grace period.")) return;
    
    try {
      setIsDeleting(true);
      const res = await fetch('/api/me/request-deletion', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to request deletion");
      
      toast({
        title: "Account Deletion Requested",
        description: "Your account is now scheduled for deletion in 7 days.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestrictProcessing = async (checked: boolean) => {
    try {
      const endpoint = checked ? '/api/consent/restrict-processing' : '/api/consent/unrestrict-processing';
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to update processing restriction");
      
      setIsRestricting(checked);
      toast({
        title: "Settings Updated",
        description: checked 
          ? "Data processing restricted. You may have limited access to features."
          : "Data processing restriction lifted.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update your preferences.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm bg-background/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-6 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download a copy of your personal data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            You have the right to receive a copy of your personal data collected by KIZERE in a structured, commonly used, and machine-readable format (Rwanda Law No. 058/2021).
          </p>
          <Button onClick={handleDataExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? "Exporting..." : "Download My Data (JSON)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-background/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-6 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Consent & Data Processing</CardTitle>
              <CardDescription>Manage how your data is used</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-1 pr-6">
              <Label htmlFor="restrict-processing" className="font-semibold text-base">Restrict Processing</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily suspend active processing of your personal data. This may limit your ability to use certain platform features.
              </p>
            </div>
            <Switch 
              id="restrict-processing" 
              checked={isRestricting} 
              onCheckedChange={handleRestrictProcessing}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-4 border-t">
            <div className="space-y-1 pr-6">
              <Label className="font-semibold text-base">Marketing Consent</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and promotions.
              </p>
            </div>
            <Switch id="marketing-consent" defaultChecked={true} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 shadow-sm bg-destructive/5 backdrop-blur-xl">
        <CardHeader className="border-b border-destructive/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Delete your account and all associated data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20 text-sm text-destructive-foreground/90 flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              Requesting deletion will suspend your account immediately. We retain your data for a 7-day grace period in case you change your mind. After 7 days, your personal information is permanently erased.
            </p>
          </div>
          
          {user?.deletionRequestedAt ? (
            <div className="flex items-center gap-2 text-primary font-medium p-4 bg-primary/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <span>Deletion requested on {new Date(user.deletionRequestedAt).toLocaleDateString()}. Account will be permanently deleted shortly.</span>
            </div>
          ) : (
            <Button 
              onClick={handleAccountDeletion} 
              disabled={isDeleting} 
              variant="destructive" 
              className="w-full sm:w-auto"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? "Requesting..." : "Request Account Deletion"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
