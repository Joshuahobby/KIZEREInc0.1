import * as React from "react";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

// Use a global singleton for LoadingContext
const LOADING_CONTEXT_KEY = Symbol.for("kizere-loading-context");

// Create the context with a default value
const LoadingContext = ((globalThis as any)[LOADING_CONTEXT_KEY] as React.Context<LoadingContextType>) || React.createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => { },
  stopLoading: () => { },
});

if (!(globalThis as any)[LOADING_CONTEXT_KEY]) {
  (globalThis as any)[LOADING_CONTEXT_KEY] = LoadingContext;
  LoadingContext.displayName = "LoadingContext";
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that wraps the app to provide loading state management
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Simplified loading management
  const startLoading = () => {
    setIsLoading(true);

    // Auto-reset loading state after 2 seconds as a safety measure
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Custom hook to use the loading state context
 */
export function useLoadingState() {
  const context = React.useContext(LoadingContext);

  if (context === undefined) {
    throw new Error("useLoadingState must be used within a LoadingProvider");
  }

  return context;
}