import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Keep track of pending auth check to avoid multiple simultaneous calls
let authCheckPending = false;
let authCheckPromise: Promise<void> | null = null;
let lastSessionCheckTime = 0;
const SESSION_CHECK_TTL_MS = 60 * 1000; // 1 minute TTL

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

declare global {
  interface Window {
    firebase?: any;
  }
}

/**
 * Utility to wait for Firebase auth to initialize
 */
async function waitForFirebaseAuth(maxWaitMs = 5000): Promise<any> {
  if (!window.firebase?.auth) return null;
  const auth = window.firebase.auth();

  // If we already have a user, return immediately
  if (auth.currentUser) return auth.currentUser;

  // Otherwise wait for the first auth state change
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, maxWaitMs);

    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Checks that the user is authenticated with the server
 * This creates/refreshes a session if a Firebase token is available
 */
export async function ensureAuthenticated(forceRefresh = false): Promise<void> {
  // If not forcing refresh, check if we've successfully checked recently
  if (!forceRefresh && Date.now() - lastSessionCheckTime < SESSION_CHECK_TTL_MS) {
    return;
  }

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
        const data = await sessionCheck.json();
        if (data) {
          console.log('[QueryClient] User already has valid session');
          lastSessionCheckTime = Date.now();
          resolve();
          return;
        }
      }

      // If Firebase is available, try to get the current user
      // We wait a bit for it to initialize if it's not immediately ready
      const currentUser = await waitForFirebaseAuth();

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
            lastSessionCheckTime = Date.now();
            // Clear CSRF token after session sync to ensure fresh token for next request
            clearCsrfToken();
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
        console.log('[QueryClient] No Firebase user after waiting, authentication required');
        reject(new Error('No authenticated user'));
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

/**
 * Clears the cached CSRF token, forcing re-fetch on next request.
 * Call this on login/logout/session change.
 */
export function clearCsrfToken() {
  cachedCsrfToken = null;
  csrfTokenPromise = null;
}

/**
 * Ensures we have a valid CSRF token.
 * Fetches one from the server if not already cached.
 */
export async function ensureCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      const res = await fetch("/api/csrf-token", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch CSRF token");
      const { csrfToken } = await res.json();
      cachedCsrfToken = csrfToken;
      return csrfToken;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
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
    } catch (error: any) {
      console.error('[apiRequest] Authentication failed for admin request:', error);
      throw new Error(`Authentication required for ${url}: ${error.message}`);
    }
  }

  const method = options?.method || 'GET';
  const data = options?.data;

  const headers: Record<string, string> = {};
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Include CSRF token for state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    try {
      const csrfToken = await ensureCsrfToken();
      headers["X-CSRF-Token"] = csrfToken;
    } catch (error) {
      console.error("[apiRequest] Failed to get CSRF token:", error);
    }
  }

  const isFormData = data instanceof FormData;
  const body = isFormData ? data : (data ? JSON.stringify(data) : undefined);

  let res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // If we get a CSRF error, clear cached token, get a fresh one, and retry once
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    let isCsrfError = false;
    if (res.status === 403 || res.status === 500) {
      try {
        const cloned = res.clone();
        const text = await cloned.text();
        isCsrfError = text.toLowerCase().includes('csrf');
      } catch { /* ignore */ }
    }
    if (isCsrfError) {
      console.warn(`[apiRequest] CSRF token invalid for ${url}, refreshing...`);
      clearCsrfToken();
      try {
        const freshToken = await ensureCsrfToken();
        headers["X-CSRF-Token"] = freshToken;
        res = await fetch(url, {
          method,
          headers,
          body,
          credentials: "include",
        });
      } catch (csrfError) {
        console.error('[apiRequest] CSRF retry failed:', csrfError);
      }
    }
  }

  // If we get a 401, try to re-authenticate and retry once
  // But NOT for auth endpoints — a 401 there means wrong credentials, not expired session
  const isAuthEndpoint = url.startsWith('/api/auth/');
  if (res.status === 401 && !isAuthEndpoint) {
    console.warn(`[apiRequest] 401 Unauthorized for ${url}, attempting sync...`);
    try {
      await ensureAuthenticated(true);
      // Also refresh CSRF token since session may have changed
      clearCsrfToken();
      const freshToken = await ensureCsrfToken();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
        headers["X-CSRF-Token"] = freshToken;
      }
      console.log(`[apiRequest] Sync successful, retrying ${url}`);
      res = await fetch(url, {
        method,
        headers,
        body,
        credentials: "include",
      });
    } catch (authError) {
      console.error('[apiRequest] Re-authentication failed:', authError);
      // Let it fall through to throwIfResNotOk
    }
  }

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
        } catch (error: any) {
          console.error('[getQueryFn] Authentication failed for admin request:', error);
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw new Error(`Authentication required for ${url}: ${error.message}`);
        }
      }

      try {
        console.log(`Making request to: ${url}`);
        let res = await fetch(url, {
          credentials: "include",
        });

        console.log(`Response status for ${url}: ${res.status}`);

        // If we get a 401, try to re-authenticate and retry once
        if (res.status === 401) {
          console.warn(`[getQueryFn] 401 Unauthorized for ${url}, attempting sync...`);
          try {
            await ensureAuthenticated(true);
            console.log(`[getQueryFn] Sync successful, retrying ${url}`);
            res = await fetch(url, {
              credentials: "include",
            });
            console.log(`Retry response status for ${url}: ${res.status}`);
          } catch (authError) {
            console.error('[getQueryFn] Re-authentication failed:', authError);
            // Let it fall through
          }
        }

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
