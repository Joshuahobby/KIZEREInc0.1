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
      <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
        <CardHeader className="border-b border-white/5 pb-6 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Data Export</CardTitle>
              <CardDescription className="font-bold text-white/40 text-xs">Download a copy of your personal data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <p className="text-sm font-bold text-white/60 leading-relaxed">
            You have the right to receive a copy of your personal data collected by KIZERE in a structured, commonly used, and machine-readable format (Rwanda Law No. 058/2021).
          </p>
          <Button onClick={handleDataExport} disabled={isExporting} variant="outline" className="h-14 w-full md:w-auto rounded-2xl font-black bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all shadow-premium">
            {isExporting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Download className="mr-3 h-5 w-5" />}
            {isExporting ? "Exporting..." : "Download My Data (JSON)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
        <CardHeader className="border-b border-white/5 pb-6 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Consent & Data Processing</CardTitle>
              <CardDescription className="font-bold text-white/40 text-xs">Manage how your data is used</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-[500px]">
              <Label htmlFor="restrict-processing" className="font-black text-white uppercase tracking-widest text-xs">Restrict Processing</Label>
              <p className="text-sm font-bold text-white/50 leading-relaxed">
                Temporarily suspend active processing of your personal data. This may limit your ability to use certain platform features.
              </p>
            </div>
            <div className="flex items-center h-14 px-4 bg-white/5 rounded-2xl border border-white/5 w-full md:w-auto shrink-0 touch-target-standard">
               <Switch 
                id="restrict-processing" 
                checked={isRestricting} 
                onCheckedChange={handleRestrictProcessing}
                className="scale-125"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 border-t border-white/5">
            <div className="space-y-2 max-w-[500px]">
              <Label className="font-black text-white uppercase tracking-widest text-xs">Marketing Consent</Label>
              <p className="text-sm font-bold text-white/50 leading-relaxed">
                Receive emails about new features and promotions.
              </p>
            </div>
            <div className="flex items-center h-14 px-4 bg-white/5 rounded-2xl border border-white/5 w-full md:w-auto shrink-0 touch-target-standard">
              <Switch id="marketing-consent" defaultChecked={true} className="scale-125" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20 shadow-premium bg-[#1A0B0B]">
        <CardHeader className="border-b border-red-500/10 pb-6 bg-gradient-to-r from-red-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white">Danger Zone</CardTitle>
              <CardDescription className="font-bold text-red-500/60 text-xs">Delete your account and all associated data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="rounded-2xl bg-red-500/5 p-5 border border-red-500/10 flex gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-red-500" />
            <p className="text-sm font-bold text-white/60 leading-relaxed">
              Requesting deletion will suspend your account immediately. We retain your data for a 7-day grace period in case you change your mind. After 7 days, your personal information is permanently erased.
            </p>
          </div>
          
          {user?.deletionRequestedAt ? (
            <div className="flex items-center gap-3 text-red-500 font-black p-5 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm uppercase tracking-wider">Deletion requested on {new Date(user.deletionRequestedAt).toLocaleDateString()}</span>
            </div>
          ) : (
            <Button 
              onClick={handleAccountDeletion} 
              disabled={isDeleting} 
              variant="destructive" 
              className="h-14 w-full md:w-auto rounded-2xl font-black bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-3"
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              {isDeleting ? "Requesting..." : "Request Account Deletion"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
