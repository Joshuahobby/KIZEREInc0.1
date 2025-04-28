import { QueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// API request utility function
export async function apiRequest(arg: string | { url: string; method?: string; data?: any }) {
  try {
    let url: string;
    let method: string = 'GET';
    let data: any = undefined;

    if (typeof arg === 'string') {
      url = arg;
    } else {
      url = arg.url;
      method = arg.method || 'GET';
      data = arg.data;
    }

    const config = {
      method,
      url,
      data,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    
    // Handle API errors
    if (error instanceof AxiosError && error.response) {
      const { status, data } = error.response;
      
      // Check if response has a message
      const errorMessage = data?.message || 'An unexpected error occurred';
      
      // Enhance error with status and message
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = status;
      (enhancedError as any).data = data;
      
      throw enhancedError;
    }
    
    // For non-axios errors
    throw error;
  }
}