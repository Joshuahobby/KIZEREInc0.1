import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // First try to parse as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await res.json();
        errorMessage = jsonData.message || jsonData.error || JSON.stringify(jsonData);
      } else {
        // If not JSON, try to get as text
        errorMessage = await res.text();
      }
    } catch (err) {
      console.error('Error parsing error response:', err);
      // Keep original status text if parsing fails
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Making request to: ${queryKey[0]}`);
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      console.log(`Response status for ${queryKey[0]}: ${res.status}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for 401 response to ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if response body is empty
      const contentLength = res.headers.get('content-length');
      if (contentLength === '0') {
        console.log(`Empty response body for ${queryKey[0]}`);
        return null;
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Non-JSON response for ${queryKey[0]}: ${contentType}`);
        const text = await res.text();
        console.log(`Response text: ${text}`);
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
