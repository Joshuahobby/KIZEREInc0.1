import { useTranslation } from "react-i18next";

interface PasswordStrengthIndicatorProps {
  score: number;
  maxScore: number;
}

export function PasswordStrengthIndicator({ score, maxScore }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  
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
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strengthColor} transition-all duration-300 ease-in-out`} 
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(`profile.security.passwordStrength.${strengthLevel}`)}
      </p>
    </div>
  );
}