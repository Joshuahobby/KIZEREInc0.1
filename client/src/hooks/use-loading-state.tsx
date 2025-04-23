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

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

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