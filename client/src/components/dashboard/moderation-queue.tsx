import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { ModerationReport } from "@shared/schema";

export function ModerationQueue() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: reports, isLoading } = useQuery<ModerationReport[]>({
    queryKey: ["/api/moderation/reports"],
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest(`/api/moderation/reports/${id}`, {
        method: "PATCH",
        data: { status }
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Report Updated",
        description: "The moderation report status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.moderation.title') || "Moderation Queue"}</CardTitle>
        <CardDescription>{t('dashboard.moderation.description') || "Review and resolve flags across the platform."}</CardDescription>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground italic">{t('dashboard.moderation.noReports') || "No reports found in the queue."}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.moderation.table.type') || "Type"}</TableHead>
                <TableHead>{t('dashboard.moderation.table.reason') || "Reason"}</TableHead>
                <TableHead>{t('dashboard.moderation.table.reporter') || "Reporter"}</TableHead>
                <TableHead>{t('dashboard.moderation.table.status') || "Status"}</TableHead>
                <TableHead>{t('dashboard.moderation.table.date') || "Date"}</TableHead>
                <TableHead className="text-right">{t('dashboard.moderation.table.actions') || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.reportId ? "Report" : report.itemId ? "Item" : report.claimId ? "Claim" : "Other"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">{report.reason.replace("_", " ")}</span>
                      {report.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {report.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{report.reporterEmail || "Anonymous"}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'pending' ? 'outline' : 'secondary'} className="capitalize">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(report.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {report.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => mutation.mutate({ id: report.id, status: 'resolved' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('common.actions.resolve') || "Resolve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => mutation.mutate({ id: report.id, status: 'dismissed' })}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> {t('common.actions.dismiss') || "Dismiss"}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
