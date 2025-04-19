import { toast } from "@/hooks/use-toast";

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function handleError(error: unknown, fallbackMessage = "An unexpected error occurred") {
  const message = isErrorWithMessage(error) ? error.message : fallbackMessage;
  
  // Log error to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // logErrorToService(error); 
    // Note: This would integrate with a monitoring service like Sentry
  }
  
  // Show user-friendly message
  toast({
    variant: "destructive",
    title: "Error",
    description: message,
  });
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
}