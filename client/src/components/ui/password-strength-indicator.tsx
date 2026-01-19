import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  score: number;
  maxScore: number;
}

export function PasswordStrengthIndicator({ score, maxScore }: PasswordStrengthIndicatorProps) {
  const { t } = useLanguage();
  
  // Calculate the strength percentage
  const strengthPercentage = (score / maxScore) * 100;
  
  // Determine strength level based on score
  let strengthLevel: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  let strengthColor: string;
  
  if (score === 0) {
    strengthLevel = 'weak';
    strengthColor = 'bg-red-500';
  } else if (score <= maxScore * 0.25) {
    strengthLevel = 'weak';
    strengthColor = 'bg-red-500';
  } else if (score <= maxScore * 0.5) {
    strengthLevel = 'fair';
    strengthColor = 'bg-orange-500';
  } else if (score <= maxScore * 0.75) {
    strengthLevel = 'good';
    strengthColor = 'bg-yellow-500';
  } else if (score < maxScore) {
    strengthLevel = 'strong';
    strengthColor = 'bg-green-500';
  } else {
    strengthLevel = 'very-strong';
    strengthColor = 'bg-green-600';
  }
  
  return (
    <div className="space-y-1 mt-1">
      <Progress 
        value={strengthPercentage} 
        className="h-1" 
        indicatorClassName={strengthColor}
      />
      <p className="text-xs text-muted-foreground">
        {t(`profile.security.passwordStrength.${strengthLevel}`)}
      </p>
    </div>
  );
}