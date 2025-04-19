import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, AlertTriangle, CheckCircle2, Search, PlusCircle 
} from "lucide-react";

export function QuickActionsPanel() {
  return (
    <Card className="bg-gradient-to-br from-[#00BFFF]/5 to-[#FFDD00]/5 border-[#00BFFF]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <PlusCircle className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#00BFFF] to-[#0099CC] hover:from-[#33CCFF] hover:to-[#00BFFF] text-white"
            onClick={() => window.location.href = '/register-item'}
          >
            <ClipboardList className="h-5 w-5 mb-1" />
            <span>Register Item</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#FF4D4D] to-[#CC0000] hover:from-[#FF6666] hover:to-[#FF4D4D] text-white"
            onClick={() => window.location.href = '/lost-found/report?type=lost'}
          >
            <AlertTriangle className="h-5 w-5 mb-1" />
            <span>Report Lost</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] hover:from-[#66BB6A] hover:to-[#4CAF50] text-white"
            onClick={() => window.location.href = '/lost-found/report?type=found'}
          >
            <CheckCircle2 className="h-5 w-5 mb-1" />
            <span>Report Found</span>
          </Button>
          <Button 
            className="flex flex-col h-auto py-4 bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] hover:from-[#BA68C8] hover:to-[#9C27B0] text-white"
            onClick={() => window.location.href = '/search'}
          >
            <Search className="h-5 w-5 mb-1" />
            <span>Search Items</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}