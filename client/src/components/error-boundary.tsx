import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Props for ErrorBoundary component
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /**
   * Update state so the next render will show the fallback UI
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log the error to an error reporting service
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // In production, we would send this to an error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTrackingService(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Render the component
   */
  public render() {
    // If there's an error, show the fallback UI
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, show the default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 rounded-lg bg-muted/30 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-900 text-left w-full overflow-auto max-h-[200px]">
              <p className="font-mono text-sm whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Otherwise, render the children normally
    return this.props.children;
  }
}