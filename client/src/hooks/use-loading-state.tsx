import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

// Create the context with a default value
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app to provide loading state management
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

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
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    throw new Error("useLoadingState must be used within a LoadingProvider");
  }
  
  return context;
}