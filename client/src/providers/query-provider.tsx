import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { handleError } from "@/utils/error-handler";

/**
 * QueryProvider component
 * 
 * Sets up TanStack Query v5 with optimized settings
 * Provides a global error handling mechanism for queries and mutations
 */
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create queryClient instance inside component to ensure
  // it's created once per client session rather than shared across requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  
  // Set up global error handler by listening to query errors
  queryClient.getQueryCache().subscribe({
    onError: (error) => {
      handleError(error);
    },
  });
  
  // Set up global error handler for mutations
  queryClient.getMutationCache().subscribe({
    onError: (error) => {
      handleError(error);
    },
  });

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}