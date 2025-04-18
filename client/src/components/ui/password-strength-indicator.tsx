import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  passwordStrength: {
    isStrong: boolean;
    message: string;
  } | null;
}

export function PasswordStrengthIndicator({ passwordStrength }: PasswordStrengthIndicatorProps) {
  if (!passwordStrength) return null;
  
  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        {passwordStrength.isStrong ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
        <span className={`text-xs ${passwordStrength.isStrong ? 'text-green-500' : 'text-amber-500'}`}>
          {passwordStrength.message}
        </span>
      </div>
      <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${passwordStrength.isStrong ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: passwordStrength.isStrong ? '100%' : '50%' }}
        />
      </div>
    </div>
  );
}