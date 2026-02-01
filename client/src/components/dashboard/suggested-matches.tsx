import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Report } from "@shared/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SuggestedMatchesProps {
  reportId: number | null;
}

type MatchResult = Report & { matchScore: number };

export function SuggestedMatches({ reportId }: SuggestedMatchesProps) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  const { data: matches, isLoading } = useQuery<MatchResult[]>({
    queryKey: [`/api/reports/matches/${reportId}`],
    enabled: !!reportId,
  });

  if (!reportId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t('dashboard.matching.selectToSee')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('dashboard.matching.title')}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {t('dashboard.matching.foundCount', { count: matches?.length || 0 })}
          </Badge>
        </div>
        <CardDescription>{t('dashboard.matching.description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {!matches || matches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('dashboard.matching.noMatches')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {matches.map((match) => (
              <div key={match.id} className="p-4 hover:bg-muted/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={match.type === 'found' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                    {match.type.toUpperCase()}
                  </Badge>
                  <div className="text-[10px] font-bold text-primary">
                    {t('dashboard.matching.matchScore', { score: Math.min(100, Math.round((match.matchScore / 10) * 100)) })}
                  </div>
                </div>
                
                <h5 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {match.title}
                </h5>
                
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {match.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {format(new Date(match.date), 'MMM d, yyyy')}
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs h-7 gap-1"
                  onClick={() => setLocation(`/matches?source=${reportId}&target=${match.id}`)}
                >
                  {t('dashboard.matching.inspect')} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
