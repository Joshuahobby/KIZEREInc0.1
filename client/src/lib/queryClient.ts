import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Keep track of pending auth check to avoid multiple simultaneous calls
let authCheckPending = false;
let authCheckPromise: Promise<void> | null = null;

/**
 * Checks that the user is authenticated with the server
 * This creates/refreshes a session if a Firebase token is available
 */
export async function ensureAuthenticated(): Promise<void> {
  // If there's already a check in progress, return its promise
  if (authCheckPending && authCheckPromise) {
    return authCheckPromise;
  }

  authCheckPending = true;
  
  // Create a new promise for this check
  authCheckPromise = new Promise<void>(async (resolve, reject) => {
    try {
      // First check if we already have a valid session
      const sessionCheck = await fetch('/api/user', { credentials: 'include' });
      
      // If session is valid, we're good
      if (sessionCheck.ok) {
        console.log('[QueryClient] User already has valid session');
        resolve();
        return;
      }
      
      // If Firebase is available, try to get the current user
      if (window.firebase?.auth) {
        const auth = window.firebase.auth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          console.log('[QueryClient] No valid session but Firebase user found, syncing...');
          try {
            // Get ID token
            const token = await currentUser.getIdToken(true); // Force refresh
            
            // Send to server to create session
            const response = await fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token,
                email: currentUser.email,
                name: currentUser.displayName,
                uid: currentUser.uid,
                photoURL: currentUser.photoURL
              }),
              credentials: 'include',
            });
            
            if (response.ok) {
              console.log('[QueryClient] Successfully synced Firebase auth with server');
              resolve();
            } else {
              console.error('[QueryClient] Error syncing auth with server:', response.status);
              reject(new Error(`Failed to sync authentication with server: ${response.status}`));
            }
          } catch (err) {
            console.error('[QueryClient] Error getting Firebase token:', err);
            reject(err);
          }
        } else {
          console.log('[QueryClient] No Firebase user, authentication required');
          reject(new Error('No authenticated user'));
        }
      } else {
        console.log('[QueryClient] Firebase not available');
        reject(new Error('Authentication provider not available'));
      }
    } catch (err) {
      console.error('[QueryClient] Authentication check error:', err);
      reject(err);
    } finally {
      authCheckPending = false;
      authCheckPromise = null;
    }
  });
  
  return authCheckPromise;
}

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
  // For admin routes, ensure authentication first
  if (url.startsWith('/api/admin')) {
    try {
      await ensureAuthenticated();
    } catch (error) {
      console.error('[apiRequest] Authentication failed for admin request:', error);
      throw new Error(`Authentication required for ${url}: ${error.message}`);
    }
  }
  
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
    const url = queryKey[0] as string;
    
    // For admin routes, ensure authentication first
    if (url.startsWith('/api/admin')) {
      try {
        await ensureAuthenticated();
      } catch (error) {
        console.error('[getQueryFn] Authentication failed for admin request:', error);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error(`Authentication required for ${url}: ${error.message}`);
      }
    }
    
    try {
      console.log(`Making request to: ${url}`);
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log(`Response status for ${url}: ${res.status}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for 401 response to ${url}`);
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if response body is empty
      const contentLength = res.headers.get('content-length');
      if (contentLength === '0') {
        console.log(`Empty response body for ${url}`);
        return null;
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Non-JSON response for ${url}: ${contentType}`);
        const text = await res.text();
        console.log(`Response text: ${text}`);
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
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
